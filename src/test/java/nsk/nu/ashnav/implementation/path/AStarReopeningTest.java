package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

final class AStarReopeningTest {

    @Test
    void reopensClosedNodeForAdmissibleInconsistentHeuristic() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{1, 2}, {3}, {1}, {}},
                new double[][]{{3.0, 1.0}, {2.0}, {1.0}, {}}
        );
        AStarPathfinder pathfinder = new AStarPathfinder(graph, (node, goal) -> node == 2 ? 3.0 : 0.0);

        PathSearchResult result = pathfinder.findPath(0, 3);

        assertEquals(4.0, result.path().totalCost());
        assertEquals(4, result.visitedNodeCount());
        assertArrayEquals(new int[]{0, 2, 1, 3}, result.path().nodes());
        assertEquals(new DijkstraPathfinder(graph).findPath(0, 3).path().totalCost(), result.path().totalCost());
    }

    @Test
    void overestimatingHeuristicDoesNotGuaranteeOptimality() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{2, 1}, {2}, {}},
                new double[][]{{10.0, 1.0}, {1.0}, {}}
        );

        assertEquals(10.0, new AStarPathfinder(graph, (node, goal) -> node == 1 ? 100.0 : 0.0)
                .findPath(0, 2).path().totalCost());
        assertEquals(2.0, new DijkstraPathfinder(graph).findPath(0, 2).path().totalCost());
    }
}
