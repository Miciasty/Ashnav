package nsk.nu.ashnav.implementation.graph;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class WeightedAdjacencyIntGraphTest {

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
