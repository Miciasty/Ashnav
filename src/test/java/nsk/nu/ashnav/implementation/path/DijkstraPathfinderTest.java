package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

final class DijkstraPathfinderTest {

    @Test
    void choosesLowestTotalCostPath() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {1, 3},
                        {3},
                        {},
                        {}
                },
                new double[][]{
                        {2.0, 10.0},
                        {2.0},
                        {},
                        {}
                }
        );
        DijkstraPathfinder pathfinder = new DijkstraPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(0, 3);

        assertEquals(PathStatus.FOUND, result.status());
        assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
        assertEquals(4.0, result.path().totalCost());
    }

    @Test
    void usesDeterministicTieBreakWhenTotalCostIsEqual() {
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
        DijkstraPathfinder pathfinder = new DijkstraPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(0, 3);

        assertEquals(PathStatus.FOUND, result.status());
        assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
    }

    @Test
    void returnsUnreachableForDisconnectedGoal() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {1},
                        {},
                        {}
                },
                new double[][]{
                        {1.0},
                        {},
                        {}
                }
        );
        DijkstraPathfinder pathfinder = new DijkstraPathfinder(graph);

        PathSearchResult result = pathfinder.findPath(0, 2);

        assertEquals(PathStatus.UNREACHABLE, result.status());
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
        DijkstraPathfinder pathfinder = new DijkstraPathfinder(graph);

        for (int i = 0; i < 10; i++) {
            PathSearchResult result = pathfinder.findPath(0, 3);
            assertArrayEquals(new int[]{0, 1, 3}, result.path().nodes());
        }
    }
}
