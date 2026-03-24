package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.AdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

final class BfsPathfinderTest {

    @Test
    void findsShortestPathByHopCountDeterministically() {
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{
                {1, 2},
                {3},
                {3},
                {}
        });
        BfsPathfinder pathfinder = new BfsPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(0, 3);

        assertEquals(PathStatus.FOUND, result.status());
        assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
        assertEquals(2.0, result.path().totalCost());
    }

    @Test
    void returnsUnreachableWhenGoalCannotBeReached() {
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{
                {1},
                {},
                {}
        });
        BfsPathfinder pathfinder = new BfsPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(0, 2);

        assertEquals(PathStatus.UNREACHABLE, result.status());
    }

    @Test
    void returnsZeroCostForTrivialPath() {
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{
                {},
                {}
        });
        BfsPathfinder pathfinder = new BfsPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(1, 1);

        assertEquals(PathStatus.FOUND, result.status());
        assertArrayEquals(new int[]{1}, result.path().nodes());
        assertEquals(0.0, result.path().totalCost());
    }
}
