package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashgrid.api.raster.BoundedGrid3i;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class GridWalkabilityGraph3Test {

    @Test
    void diagonalConnectsEndpointsEvenWhenBothSideCellsAreBlocked() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 1, 2);
        grid.set(0, 0, 0, 1);
        grid.set(1, 0, 1, 1);
        GridWalkabilityGraph3 faces = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        assertEquals(PathStatus.UNREACHABLE, new DijkstraPathfinder(faces).findPath(0, 1).status());
        for (GridNeighborhood3 neighborhood : new GridNeighborhood3[]{GridNeighborhood3.N18, GridNeighborhood3.N26}) {
            GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, neighborhood);
            assertEquals(Math.sqrt(2.0), new DijkstraPathfinder(graph).findPath(0, 1).path().totalCost());
        }
    }

    @Test
    void sourceMutationRequiresRebuildingTheSnapshot() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
        fill(grid, 1);
        GridWalkabilityGraph3 snapshot = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        grid.set(1, 0, 0, 0);
        assertEquals(PathStatus.FOUND, new DijkstraPathfinder(snapshot).findPath(0, 2).status());
        GridWalkabilityGraph3 refreshed = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        assertEquals(-1, refreshed.nodeOfCell(1, 0, 0));
        assertEquals(PathStatus.UNREACHABLE, new DijkstraPathfinder(refreshed).findPath(0, 1).status());
    }

    @Test
    void rejectsInvalidCustomGridDimensionsBeforeReadingCells() {
        for (int[] dimensions : new int[][]{{1 << 30, 1 << 30, 16}, {Integer.MAX_VALUE, 2, 1}, {0, 1, 1}, {1, -1, -1}}) {
            BoundedGrid3i grid = new BoundedGrid3i() {
                @Override public int width() { return dimensions[0]; }
                @Override public int height() { return dimensions[1]; }
                @Override public int depth() { return dimensions[2]; }
                @Override public boolean inside(int x, int y, int z) { throw new AssertionError("inside called"); }
                @Override public int get(int x, int y, int z) { throw new AssertionError("get called"); }
                @Override public void set(int x, int y, int z, int value) { throw new AssertionError("set called"); }
            };
            assertThrows(IllegalArgumentException.class, () -> new GridWalkabilityGraph3(grid, value -> true, GridNeighborhood3.N6));
        }
    }

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
