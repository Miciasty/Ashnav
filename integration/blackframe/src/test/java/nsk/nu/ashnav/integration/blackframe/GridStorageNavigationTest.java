package nsk.nu.ashnav.integration.blackframe;

import nsk.nu.ashcore.api.spi.ServiceRegistry;
import nsk.nu.ashgrid.api.raster.BoundedGrid3i;
import nsk.nu.ashgrid.api.raster.view.BitGrid3iView;
import nsk.nu.ashgrid.api.raster.view.SparseGridView3i;
import nsk.nu.ashgrid.api.voxel.ops.components.ConnectedComponents;
import nsk.nu.ashgrid.implementation.raster.arrays.ArrayGrid3i;
import nsk.nu.ashgrid.implementation.raster.bitset.BitGrid3;
import nsk.nu.ashgrid.implementation.raster.chunked.ChunkedGrid3i;
import nsk.nu.ashgrid.implementation.raster.sparse.HashSparseGrid3i;
import nsk.nu.ashgrid.implementation.voxel.ops.components.ConnectedComponentsBFS;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchState;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.BfsPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

final class GridStorageNavigationTest {

    @Test
    void allStorageBackendsAgreeWithGridComponentsAndWeightedPaths() {
        Random random = new Random(20260910L);
        ConnectedComponents components = ServiceRegistry.of(ConnectedComponents.class).require("ConnectedComponentsBFS");
        for (int sample = 0; sample < 8; sample++) {
            List<BoundedGrid3i> grids = storage(5, 2, 4);
            for (int z = 0; z < 4; z++) for (int y = 0; y < 2; y++) for (int x = 0; x < 5; x++) {
                int value = random.nextDouble() < 0.45 ? 1 : 0;
                for (var grid : grids) grid.set(x, y, z, value);
            }
            for (var neighborhood : GridNeighborhood3.values()) {
                var reference = new GridWalkabilityGraph3(grids.getFirst(), value -> value == 1, neighborhood);
                var labels = new ArrayGrid3i(5, 2, 4);
                components.label(grids.getFirst(), value -> value == 1, labels,
                        ConnectedComponents.Neighborhood.valueOf(neighborhood.name()));
                for (var grid : grids) {
                    var graph = new GridWalkabilityGraph3(grid, value -> value == 1, neighborhood);
                    assertEquals(reference.nodeCount(), graph.nodeCount());
                    for (int node = 0; node < graph.nodeCount(); node++) {
                        assertEquals(reference.cellOfNode(node), graph.cellOfNode(node));
                        assertEquals(edges(reference, node), edges(graph, node));
                    }
                    var bfs = new BfsPathfinder(graph);
                    var dijkstra = new DijkstraPathfinder(graph);
                    var astar = new AStarPathfinder(graph, (from, goal) -> 0.0);
                    for (int start = 0; start < graph.nodeCount(); start++) {
                        var a = graph.cellOfNode(start);
                        for (int goal = 0; goal < graph.nodeCount(); goal++) {
                            var b = graph.cellOfNode(goal);
                            boolean connected = labels.get(a.x(), a.y(), a.z()) == labels.get(b.x(), b.y(), b.z());
                            assertEquals(connected, bfs.findPath(start, goal).status() == PathStatus.FOUND);
                            var weighted = dijkstra.findPath(start, goal);
                            assertEquals(connected, weighted.status() == PathStatus.FOUND);
                            var session = astar.startSearch(start, goal);
                            while (session.state() == PathSearchState.IN_PROGRESS) session.advance(3);
                            assertEquals(weighted.status(), session.result().status());
                            if (connected) assertEquals(weighted.path().totalCost(), session.result().path().totalCost(), 1e-12);
                        }
                    }
                }
            }
        }
    }

    @Test
    void sourceMutationDoesNotChangeAnInProgressNavigationSnapshot() {
        for (var grid : storage(3, 1, 1)) {
            for (int x = 0; x < 3; x++) grid.set(x, 0, 0, 1);
            var captured = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
            var session = new DijkstraPathfinder(captured).startSearch(0, 2);
            assertEquals(PathSearchState.IN_PROGRESS, session.advance(1));
            grid.set(1, 0, 0, 0);
            while (session.state() == PathSearchState.IN_PROGRESS) session.advance(1);
            assertArrayEquals(new int[]{0, 1, 2}, session.result().path().nodes());
            var refreshed = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
            assertEquals(-1, refreshed.nodeOfCell(1, 0, 0));
            assertEquals(PathStatus.UNREACHABLE, new BfsPathfinder(refreshed).findPath(0, 1).status());
        }
    }

    @Test
    void steppedGridPreprocessingProducesTheSameNavigationRegions() {
        var grid = new ArrayGrid3i(5, 1, 2);
        for (int z = 0; z < 2; z++) for (int x = 0; x < 5; x++) grid.set(x, 0, z, x == 2 ? 0 : 1);
        var labels = new ArrayGrid3i(5, 1, 2);
        try (var task = new ConnectedComponentsBFS().begin(grid, value -> value == 1, labels, ConnectedComponents.Neighborhood.N6)) {
            while (!task.isDone()) task.step(1);
            assertEquals(2, task.count());
        }
        var graph = new GridWalkabilityGraph3(labels, value -> value == 1, GridNeighborhood3.N6);
        assertEquals(4, graph.nodeCount());
        assertEquals(PathStatus.FOUND, new BfsPathfinder(graph).findPath(0, 3).status());
        assertEquals(-1, graph.nodeOfCell(4, 0, 1));
    }

    private static List<BoundedGrid3i> storage(int width, int height, int depth) {
        return List.of(new ArrayGrid3i(width, height, depth), new BitGrid3iView(new BitGrid3(width, height, depth)),
                new SparseGridView3i(new HashSparseGrid3i(0), -17, -3, -9, width, height, depth),
                new SparseGridView3i(new ChunkedGrid3i(2, 3, 4, 0), -17, -3, -9, width, height, depth));
    }

    private static List<String> edges(GridWalkabilityGraph3 graph, int node) {
        List<String> result = new ArrayList<>();
        graph.forEachEdge(node, (neighbor, cost) -> result.add(neighbor + ":" + cost));
        return result;
    }
}
