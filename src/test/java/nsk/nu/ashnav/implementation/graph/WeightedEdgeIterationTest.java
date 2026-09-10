package nsk.nu.ashnav.implementation.graph;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.function.IntConsumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class WeightedEdgeIterationTest {

    @Test
    void optimizedIterationRetainsDuplicatesFirstCostsAndOrder() {
        for (double[] row : new double[][]{{10.0, 1.0, 0.0}, {1.0, 10.0, 0.0}}) {
            WeightedIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1, 1, 0}, {}}, new double[][]{row, {}});
            List<Integer> neighbors = new ArrayList<>();
            List<Double> costs = new ArrayList<>();
            graph.forEachEdge(0, (node, cost) -> { neighbors.add(node); costs.add(cost); });
            assertEquals(List.of(1, 1, 0), neighbors);
            assertEquals(List.of(row[0], row[0], 0.0), costs);
            assertEquals(graph.edgeCost(0, 1), costs.get(1));
            assertThrows(NullPointerException.class, () -> graph.forEachEdge(0, null));
            assertThrows(IllegalArgumentException.class, () -> graph.forEachEdge(2, (node, cost) -> {}));
        }
        assertThrows(IllegalArgumentException.class, () -> new WeightedAdjacencyIntGraph(
                new int[][]{{1, 1}, {}}, new double[][]{{1.0, Double.NaN}, {}}));
    }

    @Test
    void gridPairsMatchNeighborAndCostQueries() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 3, 3);
        for (GridNeighborhood3 neighborhood : GridNeighborhood3.values()) {
            GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> true, neighborhood);
            for (int from = 0; from < graph.nodeCount(); from++) {
                int node = from;
                List<Integer> expected = new ArrayList<>();
                List<Integer> actual = new ArrayList<>();
                graph.forEachNeighbor(node, expected::add);
                graph.forEachEdge(node, (to, cost) -> {
                    actual.add(to);
                    assertEquals(graph.edgeCost(node, to), cost);
                });
                assertEquals(expected, actual);
            }
        }
    }

    @Test
    void legacyGraphDefaultWorksAndNativePairsAvoidLookup() {
        WeightedIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1}, {}}, new double[][]{{2.0}, {}});
        int[] lookups = {0};
        WeightedIntGraph legacy = new WeightedIntGraph() {
            @Override public int nodeCount() { return graph.nodeCount(); }
            @Override public void forEachNeighbor(int nodeId, IntConsumer consumer) { graph.forEachNeighbor(nodeId, consumer); }
            @Override public double edgeCost(int from, int to) { lookups[0]++; return graph.edgeCost(from, to); }
        };
        assertEquals(2.0, new DijkstraPathfinder(legacy).findPath(0, 1).path().totalCost());
        assertEquals(1, lookups[0]);
        WeightedIntGraph pairsOnly = new WeightedIntGraph() {
            @Override public int nodeCount() { return graph.nodeCount(); }
            @Override public void forEachNeighbor(int nodeId, IntConsumer consumer) { graph.forEachNeighbor(nodeId, consumer); }
            @Override public double edgeCost(int from, int to) { throw new AssertionError("unexpected lookup"); }
            @Override public void forEachEdge(int nodeId, nsk.nu.ashnav.api.graph.IntWeightedEdgeConsumer consumer) {
                graph.forEachEdge(nodeId, consumer);
            }
        };
        assertEquals(2.0, new DijkstraPathfinder(pairsOnly).findPath(0, 1).path().totalCost());
        assertEquals(2.0, new AStarPathfinder(pairsOnly, (node, goal) -> 0.0).findPath(0, 1).path().totalCost());
    }
}
