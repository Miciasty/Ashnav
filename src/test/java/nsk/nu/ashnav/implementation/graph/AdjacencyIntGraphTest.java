package nsk.nu.ashnav.implementation.graph;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class AdjacencyIntGraphTest {

    @Test
    void preservesNeighborOrder() {
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{
                {2, 1, 3},
                {},
                {},
                {}
        });

        List<Integer> visited = new ArrayList<>();
        graph.forEachNeighbor(0, visited::add);

        assertEquals(List.of(2, 1, 3), visited);
    }

    @Test
    void constructorCopiesInputData() {
        int[][] raw = {
                {1},
                {}
        };
        AdjacencyIntGraph graph = new AdjacencyIntGraph(raw);

        raw[0][0] = 0;

        List<Integer> visited = new ArrayList<>();
        graph.forEachNeighbor(0, visited::add);
        assertEquals(List.of(1), visited);
    }

    @Test
    void rejectsOutOfRangeNeighborIds() {
        assertThrows(
                IllegalArgumentException.class,
                () -> new AdjacencyIntGraph(new int[][]{
                        {1}
                })
        );
    }

    @Test
    void rejectsInvalidQueryNode() {
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{
                {}
        });

        assertThrows(IllegalArgumentException.class, () -> graph.forEachNeighbor(-1, ignored -> {
        }));
        assertThrows(IllegalArgumentException.class, () -> graph.forEachNeighbor(1, ignored -> {
        }));
    }
}
