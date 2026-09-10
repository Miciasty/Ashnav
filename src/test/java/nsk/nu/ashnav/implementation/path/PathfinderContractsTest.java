package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.api.path.Pathfinder;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class PathfinderContractsTest {

    @Test
    void bfsCountsEdgesWhileWeightedSolversSumCosts() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{2, 1}, {2}, {}}, new double[][]{{10.0, 1.0}, {1.0}, {}}
        );
        PathSearchResult bfs = new BfsPathfinder(graph).findPath(0, 2);
        assertArrayEquals(new int[]{0, 2}, bfs.path().nodes());
        assertEquals(1.0, bfs.path().totalCost());
        assertEquals(2.0, new DijkstraPathfinder(graph).findPath(0, 2).path().totalCost());
        assertEquals(2.0, new AStarPathfinder(graph, (node, goal) -> 0.0).findPath(0, 2).path().totalCost());
    }

    @Test
    void weightedCostsAgreeWithFloydWarshallOnSmallGraphs() {
        Random random = new Random(938741L);
        for (int sample = 0; sample < 80; sample++) {
            int size = 2 + random.nextInt(7);
            double[][] distance = new double[size][size];
            int[][] neighbors = new int[size][];
            double[][] costs = new double[size][];
            for (int from = 0; from < size; from++) {
                Arrays.fill(distance[from], Double.POSITIVE_INFINITY);
                distance[from][from] = 0.0;
                ArrayList<Integer> row = new ArrayList<>();
                ArrayList<Double> weights = new ArrayList<>();
                for (int to = 0; to < size; to++) {
                    if (random.nextInt(3) != 0) continue;
                    double cost = random.nextInt(6);
                    row.add(to);
                    weights.add(cost);
                    distance[from][to] = Math.min(distance[from][to], cost);
                }
                neighbors[from] = row.stream().mapToInt(Integer::intValue).toArray();
                costs[from] = weights.stream().mapToDouble(Double::doubleValue).toArray();
            }
            for (int via = 0; via < size; via++) {
                for (int from = 0; from < size; from++) {
                    for (int to = 0; to < size; to++) {
                        distance[from][to] = Math.min(distance[from][to], distance[from][via] + distance[via][to]);
                    }
                }
            }
            WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(neighbors, costs);
            for (int goal = 0; goal < size; goal++) {
                double[] heuristic = new double[size];
                for (int node = 0; node < size; node++) {
                    // Select a lower bound independently at each node: consistency is not assumed.
                    if (Double.isFinite(distance[node][goal]) && random.nextBoolean()) {
                        heuristic[node] = distance[node][goal];
                    }
                }
                Pathfinder[] solvers = {
                        new DijkstraPathfinder(graph),
                        new AStarPathfinder(graph, (node, target) -> heuristic[node])
                };
                for (int start = 0; start < size; start++) {
                    for (Pathfinder solver : solvers) {
                        PathSearchResult result = solver.findPath(start, goal);
                        if (!Double.isFinite(distance[start][goal])) {
                            assertEquals(PathStatus.UNREACHABLE, result.status());
                            continue;
                        }
                        assertEquals(PathStatus.FOUND, result.status());
                        assertEquals(distance[start][goal], result.path().totalCost());
                        int[] path = result.path().nodes();
                        assertEquals(start, path[0]);
                        assertEquals(goal, path[path.length - 1]);
                        assertEquals(path.length, Arrays.stream(path).distinct().count());
                        double sum = 0.0;
                        for (int i = 1; i < path.length; i++) sum += graph.edgeCost(path[i - 1], path[i]);
                        assertEquals(result.path().totalCost(), sum);
                        assertTrue(result.visitedNodeCount() <= size);
                        assertEquals(result, solver.findPath(start, goal));
                    }
                }
            }
        }
    }

    @Test
    void rejectsNonzeroGoalAndNonFiniteEstimates() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1}, {}}, new double[][]{{1.0}, {}});
        assertThrows(IllegalStateException.class, () -> new AStarPathfinder(graph, (node, goal) -> 1.0).findPath(0, 1));
        for (double invalid : new double[]{-1.0, Double.NaN, Double.POSITIVE_INFINITY}) {
            assertThrows(IllegalStateException.class, () -> new AStarPathfinder(graph,
                    (node, goal) -> node == goal ? 0.0 : invalid).findPath(0, 1));
        }
    }

    @Test
    void rejectsOverflowInsteadOfReportingUnreachable() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{1}, {2}, {}}, new double[][]{{Double.MAX_VALUE}, {Double.MAX_VALUE}, {}}
        );
        assertThrows(IllegalStateException.class, () -> new DijkstraPathfinder(graph).findPath(0, 2));
        assertThrows(IllegalStateException.class, () -> new AStarPathfinder(graph, (node, goal) -> 0.0).findPath(0, 2));
        assertThrows(IllegalStateException.class, () -> new AStarPathfinder(graph,
                (node, goal) -> node == 1 ? Double.MAX_VALUE : 0.0).findPath(0, 2));
    }

    @Test
    void neighborOrderAffectsBfsButQueueTiesUseNodeIds() {
        for (int[] order : new int[][]{{1, 2}, {2, 1}}) {
            WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                    new int[][]{order, {3}, {3}, {}}, new double[][]{{1.0, 1.0}, {1.0}, {1.0}, {}}
            );
            assertArrayEquals(new int[]{0, order[0], 3}, new BfsPathfinder(graph).findPath(0, 3).path().nodes());
            assertArrayEquals(new int[]{0, 1, 3}, new DijkstraPathfinder(graph).findPath(0, 3).path().nodes());
            assertArrayEquals(new int[]{0, 1, 3}, new AStarPathfinder(graph, (node, goal) -> 0.0).findPath(0, 3).path().nodes());
        }
    }
}
