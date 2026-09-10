package nsk.nu.ashnav.integration.blackframe;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Segment3;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashcore.api.spi.ServiceRegistry;
import nsk.nu.ashgrid.api.voxel.traversal.VoxelTraverser;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashgrid.implementation.raster.arrays.ArrayGrid3i;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchState;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import nsk.nu.ashtrace.api.broadphase.contracts.SweepQueryableBroadPhase3;
import nsk.nu.ashtrace.api.broadphase.model.AabbEntry3;
import nsk.nu.ashtrace.api.trace.pipeline.FrameGridRayTracer3;
import nsk.nu.ashtrace.implementation.broadphase.dynamic.DynamicBvhBroadPhase3;
import nsk.nu.ashtrace.implementation.broadphase.dynamic.DynamicSpatialHashBroadPhase3;
import nsk.nu.ashtrace.implementation.broadphase.staticindex.BvhAabbBroadPhase3;
import nsk.nu.ashtrace.implementation.broadphase.staticindex.LinearAabbBroadPhase3;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class TraceNavigationPolicyTest {

    @Test
    void fourBroadPhaseIndexesProduceTheSameBodyClearanceDetourInWorldUnits() {
        var frames = FrameGraph3.worldRoot();
        var ship = new FrameId("ship");
        frames.define(ship, frames.root(), new RigidTransform3(new Quaternion(0, 0, 1, 0), new Vector3(10, 2, -4)));
        var grid = new GridWalkabilityGraph3(new ArrayGrid3i(5, 1, 5), value -> true, GridNeighborhood3.N6);
        var mapper = new GridSpaceMapper3(2, Vector3.ZERO, new SquareXZChunkScheme(16));
        var mapping = new FrameMappedGridNavigator3(grid, mapper, frames, ship);
        int start = grid.nodeOfCell(0, 0, 2);
        int goal = grid.nodeOfCell(4, 0, 2);
        var obstacle = box(mapping.worldCenterOfNode(grid.nodeOfCell(2, 0, 2)), 0.6);
        PathSearchResult reference = null;
        for (var index : indexes(obstacle)) {
            var policy = new PolicyWeightedIntGraph(grid,
                    (from, to) -> clear(index, mapping.worldCenterOfNode(from), mapping.worldCenterOfNode(to), 0.5),
                    (from, to, base) -> base * 2);
            var navigator = new FrameMappedGridNavigator3(policy, grid, mapper, frames, ship);
            var result = navigator.findPath(new DijkstraPathfinder(policy), mapping.worldCenterOfNode(start), mapping.worldCenterOfNode(goal));
            assertEquals(PathStatus.FOUND, result.status());
            assertEquals(12, result.path().totalCost());
            if (reference != null) assertArrayEquals(reference.path().nodes(), result.path().nodes());
            reference = result;
            var session = new AStarPathfinder(policy, (from, to) -> 0).startSearch(start, goal);
            while (session.state() == PathSearchState.IN_PROGRESS) session.advance(1);
            assertEquals(result.path().totalCost(), session.result().path().totalCost());
            int[] route = result.path().nodes();
            for (int i = 1; i < route.length; i++) {
                assertTrue(clear(index, mapping.worldCenterOfNode(route[i - 1]), mapping.worldCenterOfNode(route[i]), 0.5));
            }
        }
    }

    @Test
    void newQuerySeesDynamicObstacleRemovalAfterPreviousQueryFinishes() {
        var frames = FrameGraph3.worldRoot();
        var grid = new GridWalkabilityGraph3(new ArrayGrid3i(3, 1, 3), value -> true, GridNeighborhood3.N6);
        var mapping = new FrameMappedGridNavigator3(grid,
                new GridSpaceMapper3(1, Vector3.ZERO, new SquareXZChunkScheme(16)), frames, frames.root());
        var index = new DynamicBvhBroadPhase3<String>();
        long obstacle = index.insert(box(new Vector3(1.5, 0.5, 1.5), 0.3), "obstacle");
        var policy = new PolicyWeightedIntGraph(grid,
                (from, to) -> clear(index, mapping.worldCenterOfNode(from), mapping.worldCenterOfNode(to), 0.25),
                (from, to, base) -> base);
        var solver = new DijkstraPathfinder(policy);
        int start = grid.nodeOfCell(0, 0, 1);
        int goal = grid.nodeOfCell(2, 0, 1);
        var previous = solver.findPath(start, goal);
        assertEquals(4, previous.path().totalCost());
        assertTrue(index.remove(obstacle));
        var current = solver.findPath(start, goal);
        assertEquals(2, current.path().totalCost());
        assertEquals(4, previous.path().totalCost());
    }

    @Test
    void finerVoxelOcclusionCanConstrainACoarseNavigationGrid() {
        var frames = FrameGraph3.worldRoot();
        var ship = new FrameId("ship");
        frames.define(ship, frames.root(), RigidTransform3.translation(-10, 3, 7));
        var graph = new GridWalkabilityGraph3(new ArrayGrid3i(3, 1, 3), value -> true, GridNeighborhood3.N6);
        var mapper = new GridSpaceMapper3(1, Vector3.ZERO, new SquareXZChunkScheme(16));
        var mapping = new FrameMappedGridNavigator3(graph, mapper, frames, ship);
        var voxels = new FrameGridSpaceMapper3(frames, ship, 0.5, Vector3.ZERO, new SquareXZChunkScheme(16));
        var tracer = FrameGridRayTracer3.forGrid(voxels.snapshot(), ServiceRegistry.of(VoxelTraverser.class).require("dda"));
        var policy = new PolicyWeightedIntGraph(graph, (from, to) -> tracer.firstSegmentHit(ship,
                new Segment3(mapping.localCenterOfNode(from, ship), mapping.localCenterOfNode(to, ship)),
                (x, y, z) -> x >= 2 && x <= 3 && z >= 2 && z <= 3 && y >= 0 && y < 2) == null,
                (from, to, base) -> base);
        int start = graph.nodeOfCell(0, 0, 1);
        int goal = graph.nodeOfCell(2, 0, 1);
        assertEquals(2, new DijkstraPathfinder(graph).findPath(start, goal).path().totalCost());
        var result = new DijkstraPathfinder(policy).findPath(start, goal);
        assertEquals(4, result.path().totalCost());
        int[] route = result.path().nodes();
        for (int i = 1; i < route.length; i++) {
            var segment = new Segment3(mapping.localCenterOfNode(route[i - 1], ship), mapping.localCenterOfNode(route[i], ship));
            assertNull(tracer.firstSegmentHit(ship, segment,
                    (x, y, z) -> x >= 2 && x <= 3 && z >= 2 && z <= 3 && y >= 0 && y < 2));
            for (var hit : tracer.allSegmentHits(ship, segment, (x, y, z) -> true)) {
                assertTrue(hit.tExit() >= hit.tEnter());
            }
        }
    }

    private static boolean clear(SweepQueryableBroadPhase3<String> index, Vector3 from, Vector3 to, double radius) {
        boolean[] blocked = {false};
        index.querySweptAabb(box(from, radius), to.sub(from), hit -> blocked[0] = true);
        return !blocked[0];
    }

    private static AxisAlignedBox box(Vector3 center, double radius) {
        var extent = new Vector3(radius, radius, radius);
        return new AxisAlignedBox(center.sub(extent), center.add(extent));
    }

    private static List<SweepQueryableBroadPhase3<String>> indexes(AxisAlignedBox obstacle) {
        var entries = List.of(new AabbEntry3<>(obstacle, "obstacle"));
        var hash = new DynamicSpatialHashBroadPhase3<String>(2);
        hash.insert(obstacle, "obstacle");
        var dynamic = new DynamicBvhBroadPhase3<String>();
        dynamic.insert(obstacle, "obstacle");
        return List.of(new LinearAabbBroadPhase3<>(entries), new BvhAabbBroadPhase3<>(entries), hash, dynamic);
    }
}
