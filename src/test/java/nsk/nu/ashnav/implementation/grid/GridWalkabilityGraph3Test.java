package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class GridWalkabilityGraph3Test {

    @Test
    void buildsNodeSetFromWalkabilityPredicate() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 2);
        fill(grid, 1);
        grid.set(1, 0, 0, 0);
        grid.set(2, 0, 1, 0);

        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);

        assertEquals(4, graph.nodeCount());
        assertEquals(-1, graph.nodeOfCell(1, 0, 0));
        assertTrue(graph.nodeOfCell(0, 0, 0) >= 0);
    }

    @Test
    void emitsNeighborsInDeterministicNeighborhoodOrder() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
        fill(grid, 1);

        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        int center = graph.nodeOfCell(1, 0, 0);

        List<Integer> neighbors = new ArrayList<>();
        graph.forEachNeighbor(center, neighbors::add);

        assertEquals(List.of(graph.nodeOfCell(2, 0, 0), graph.nodeOfCell(0, 0, 0)), neighbors);
    }

    @Test
    void usesEuclideanStepCostForGridEdges() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 2, 1);
        fill(grid, 1);

        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N26);

        int from = graph.nodeOfCell(0, 0, 0);
        int diagonal = graph.nodeOfCell(1, 1, 0);

        assertEquals(Math.sqrt(2.0), graph.edgeCost(from, diagonal), 1e-12);
    }

    private static void fill(IntArrayGrid3i grid, int value) {
        for (int z = 0; z < grid.depth(); z++) {
            for (int y = 0; y < grid.height(); y++) {
                for (int x = 0; x < grid.width(); x++) {
                    grid.set(x, y, z, value);
                }
            }
        }
    }
}
