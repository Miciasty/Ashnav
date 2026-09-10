package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class AStarPathfinderTest {

    @Test
    void findsPathWithConsistentHeuristic() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {1, 2},
                        {3},
                        {3},
                        {}
                },
                new double[][]{
                        {1.0, 1.0},
                        {2.0},
                        {2.0},
                        {}
                }
        );
        AStarPathfinder pathfinder = new AStarPathfinder(graph, (node, goal) -> node == goal ? 0.0 : 1.0);

        PathSearchResult result = pathfinder.findPath(0, 3);

        assertEquals(PathStatus.FOUND, result.status());
        assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
        assertEquals(3.0, result.path().totalCost());
    }

    @Test
    void rejectsInvalidHeuristicValues() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {1},
                        {}
                },
                new double[][]{
                        {1.0},
                        {}
                }
        );
        AStarPathfinder pathfinder = new AStarPathfinder(graph, (node, goal) -> node == 0 ? -1.0 : 0.0);

        assertThrows(IllegalStateException.class, () -> pathfinder.findPath(0, 1));
    }

    @Test
    void returnsSamePathAcrossRepeatedRuns() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {1, 2},
                        {3},
                        {3},
                        {}
                },
                new double[][]{
                        {1.0, 1.0},
                        {2.0},
                        {2.0},
                        {}
                }
        );
        AStarPathfinder pathfinder = new AStarPathfinder(graph, (node, goal) -> node == goal ? 0.0 : 1.0);

        for (int i = 0; i < 10; i++) {
            PathSearchResult result = pathfinder.findPath(0, 3);
            assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
        }
    }
}
