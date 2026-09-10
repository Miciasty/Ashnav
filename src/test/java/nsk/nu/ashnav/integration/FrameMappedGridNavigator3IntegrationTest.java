package nsk.nu.ashnav.integration;

import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class FrameMappedGridNavigator3IntegrationTest {

    @Test
    void mapsRotatedTranslatedGridBetweenWorldAndDifferentLocalFrames() {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId seat = new FrameId("seat");
        frames.define(ship, frames.root(), new RigidTransform3(new Quaternion(0.0, 0.0, 1.0, 0.0), new Vector3(10.0, 4.0, -6.0)));
        frames.define(seat, ship, RigidTransform3.translation(2.0, 0.0, 0.0));
        GridWalkabilityGraph3 base = graph();
        PolicyWeightedIntGraph policy = new PolicyWeightedIntGraph(base, (from, to) -> true, (from, to, original) -> original * 3.0);
        FrameMappedGridNavigator3 navigator = new FrameMappedGridNavigator3(policy, base, mapper(), frames, ship);
        assertEquals(new Vector3(11.0, 5.0, -7.0), navigator.worldCenterOfNode(0));
        assertEquals(new Vector3(9.0, 5.0, -7.0), navigator.worldCenterOfNode(1));
        assertEquals(new Vector3(-3.0, 1.0, 1.0), navigator.localCenterOfNode(0, seat));
        assertEquals(0, navigator.nodeOfWorldPoint(new Vector3(11.0, 5.0, -7.0)));
        assertEquals(1, navigator.nodeOfLocalPoint(seat, new Vector3(-1.0, 1.0, 1.0)));
        DijkstraPathfinder solver = new DijkstraPathfinder(policy);
        PathSearchResult local = navigator.findPath(solver, ship, new Vector3(-1.0, 1.0, 1.0), seat, new Vector3(-1.0, 1.0, 1.0));
        assertEquals(PathStatus.FOUND, local.status());
        assertEquals(3.0, local.path().totalCost());
        assertEquals(local, navigator.findPath(solver, new Vector3(11.0, 5.0, -7.0), new Vector3(9.0, 5.0, -7.0)));
    }

    @Test
    void frameUpdatesDoNotChangeCapturedMappingAndNewNavigatorRefreshesIt() {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        frames.define(ship, frames.root(), RigidTransform3.translation(10.0, 0.0, 0.0));
        GridWalkabilityGraph3 graph = graph();
        FrameMappedGridNavigator3 captured = new FrameMappedGridNavigator3(graph, mapper(), frames, ship);
        Vector3 previous = captured.worldCenterOfNode(0);
        frames.define(ship, frames.root(), RigidTransform3.translation(100.0, 0.0, 0.0));
        FrameId later = new FrameId("later");
        frames.define(later, ship, RigidTransform3.identity());
        assertEquals(previous, captured.worldCenterOfNode(0));
        assertEquals(0, captured.nodeOfWorldPoint(previous));
        assertThrows(IllegalArgumentException.class, () -> captured.nodeOfLocalPoint(later, Vector3.ZERO));
        FrameMappedGridNavigator3 refreshed = new FrameMappedGridNavigator3(graph, mapper(), frames, ship);
        assertEquals(new Vector3(99.0, 1.0, 1.0), refreshed.worldCenterOfNode(0));
        assertEquals(-1, refreshed.nodeOfWorldPoint(previous));
    }

    @Test
    void handlesGridBoundariesMissingEndpointsAndInvalidInputs() {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        GridWalkabilityGraph3 graph = graph();
        FrameMappedGridNavigator3 navigator = new FrameMappedGridNavigator3(graph, mapper(), frames, frames.root());
        assertEquals(0, navigator.nodeOfLocalPoint(frames.root(), new Vector3(-2.0, 0.0, 0.0)));
        assertEquals(-1, navigator.nodeOfLocalPoint(frames.root(), new Vector3(Math.nextDown(-2.0), 0.0, 0.0)));
        assertEquals(1, navigator.nodeOfLocalPoint(frames.root(), new Vector3(0.0, 0.0, 0.0)));
        assertEquals(-1, navigator.nodeOfLocalPoint(frames.root(), new Vector3(2.0, 0.0, 0.0)));
        assertEquals(PathSearchResult.unreachable(0), navigator.findPath(new DijkstraPathfinder(graph),
                new Vector3(5.0, 1.0, 1.0), new Vector3(-1.0, 1.0, 1.0)));
        assertThrows(NullPointerException.class, () -> navigator.nodeOfLocalPoint(null, Vector3.ZERO));
        assertThrows(NullPointerException.class, () -> navigator.nodeOfWorldPoint(null));
        assertThrows(IllegalArgumentException.class, () -> navigator.nodeOfWorldPoint(new Vector3(Double.NaN, 0.0, 0.0)));
        assertThrows(IllegalArgumentException.class, () -> navigator.localCenterOfNode(0, new FrameId("missing")));
        assertThrows(IllegalArgumentException.class, () -> new FrameMappedGridNavigator3(graph, mapper(), frames, new FrameId("missing")));
    }

    private static GridWalkabilityGraph3 graph() {
        return new GridWalkabilityGraph3(new IntArrayGrid3i(2, 1, 1), value -> true, GridNeighborhood3.N6);
    }

    private static GridSpaceMapper3 mapper() {
        return new GridSpaceMapper3(2.0, new Vector3(-2.0, 0.0, 0.0), new SquareXZChunkScheme(16));
    }
}
