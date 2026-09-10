package nsk.nu.ashnav.implementation.graph;

import org.junit.jupiter.api.Test;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class WeightedAdjacencyIntGraphTest {

    @Test
    void duplicateEdgesUseFirstCostAndRetainEmissionOrder() {
        for (double[] row : new double[][]{{10.0, 1.0}, {1.0, 10.0}}) {
            WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1, 1}, {}}, new double[][]{row, {}});
            List<Integer> visited = new ArrayList<>();
            graph.forEachNeighbor(0, visited::add);
            assertEquals(List.of(1, 1), visited);
            assertEquals(row[0], graph.edgeCost(0, 1));
            assertEquals(row[0], new DijkstraPathfinder(graph).findPath(0, 1).path().totalCost());
            assertEquals(row[0], new AStarPathfinder(graph, (node, goal) -> 0.0).findPath(0, 1).path().totalCost());
        }
    }

    @Test
    void ownsCopiesOfInputRows() {
        int[][] neighbors = {{1}, {}};
        double[][] costs = {{2.0}, {}};
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(neighbors, costs);
        neighbors[0][0] = 0;
        costs[0][0] = 99.0;
        neighbors[0] = new int[0];
        costs[0] = new double[0];
        assertEquals(2.0, graph.edgeCost(0, 1));
    }

    @Test
    void exposesNeighborsInDeclaredOrder() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{
                        {2, 1},
                        {},
                        {}
                },
                new double[][]{
                        {3.0, 1.0},
                        {},
                        {}
                }
        );

        List<Integer> visited = new ArrayList<>();
        graph.forEachNeighbor(0, visited::add);

        assertEquals(List.of(2, 1), visited);
        assertEquals(3.0, graph.edgeCost(0, 2));
    }

    @Test
    void rejectsUnknownEdgeCostQuery() {
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

        assertThrows(IllegalArgumentException.class, () -> graph.edgeCost(1, 0));
    }
}
