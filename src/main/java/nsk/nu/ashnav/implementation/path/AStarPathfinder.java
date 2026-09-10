package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.path.GraphPathfinder;
import nsk.nu.ashnav.api.path.IntHeuristic;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;

import java.util.Arrays;
import java.util.PriorityQueue;

/**
 * Deterministic A* solver that reopens a node when a strictly cheaper route is found.
 * Optimality requires an admissible heuristic in edge-cost units and h(goal)=0;
 * consistency is not required. Local numeric validation cannot prove admissibility.
 * Equal-cost routes retain the first discovered parent, avoiding zero-cost parent cycles.
 * Queue order is f score, g score, node ID, then insertion sequence.
 * Graph and heuristic must remain stable throughout a query. Sums use rounded double
 * arithmetic without a tolerance; non-finite costs, estimates or sums throw IllegalStateException.
 * With V nodes, A neighbor emissions across all expansions and P queued states,
 * time is O(V + A + P log(1+P)) plus graph/heuristic callback costs; memory is O(V+P).
 * Reopening may make A and P much larger than the graph's edge count.
 */
public final class AStarPathfinder implements GraphPathfinder {
    private final WeightedIntGraph graph;
    private final IntHeuristic heuristic;

    public AStarPathfinder(WeightedIntGraph graph, IntHeuristic heuristic) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        if (heuristic == null) {
            throw new NullPointerException("heuristic");
        }
        this.graph = graph;
        this.heuristic = heuristic;
    }

    @Override
    public WeightedIntGraph graph() {
        return graph;
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        PathAlgorithmsSupport.requireValidQuery(graph, startNodeId, goalNodeId);

        double goalHeuristic = heuristic.estimate(goalNodeId, goalNodeId);
        PathAlgorithmsSupport.requireFiniteNonNegative(goalHeuristic, "heuristic(goal,goal)");
        if (goalHeuristic != 0.0) {
            throw new IllegalStateException("heuristic(goal,goal) must be zero");
        }

        int nodeCount = graph.nodeCount();
        int[] parent = PathAlgorithmsSupport.newParentArray(nodeCount);
        double[] gScore = new double[nodeCount];
        Arrays.fill(gScore, Double.POSITIVE_INFINITY);
        boolean[] closed = new boolean[nodeCount];
        boolean[] visited = new boolean[nodeCount];

        long[] sequenceRef = new long[]{0L};
        PriorityQueue<State> open = new PriorityQueue<>(
                (a, b) -> {
                    int cmpF = Double.compare(a.fScore, b.fScore);
                    if (cmpF != 0) return cmpF;
                    int cmpG = Double.compare(a.gScore, b.gScore);
                    if (cmpG != 0) return cmpG;
                    int cmpNode = Integer.compare(a.nodeId, b.nodeId);
                    if (cmpNode != 0) return cmpNode;
                    return Long.compare(a.sequence, b.sequence);
                }
        );

        gScore[startNodeId] = 0.0;
        double startHeuristic = heuristic.estimate(startNodeId, goalNodeId);
        PathAlgorithmsSupport.requireFiniteNonNegative(startHeuristic, "heuristic(start,goal)");
        open.add(new State(startNodeId, 0.0, startHeuristic, sequenceRef[0]++));

        int visitedNodeCount = 0;
        while (!open.isEmpty()) {
            State current = open.poll();
            int node = current.nodeId;

            if (closed[node]) {
                continue;
            }
            if (Double.compare(current.gScore, gScore[node]) > 0) {
                continue;
            }

            closed[node] = true;
            if (!visited[node]) {
                visited[node] = true;
                visitedNodeCount++;
            }

            if (node == goalNodeId) {
                PathResult path = PathAlgorithmsSupport.reconstructPath(
                        parent,
                        startNodeId,
                        goalNodeId,
                        gScore[goalNodeId]
                );
                return PathSearchResult.found(path, visitedNodeCount);
            }

            graph.forEachNeighbor(node, neighbor -> {
                PathAlgorithmsSupport.requireValidNeighbor(graph, node, neighbor);
                double edgeCost = graph.edgeCost(node, neighbor);
                PathAlgorithmsSupport.requireFiniteNonNegative(edgeCost, "edgeCost(" + node + "," + neighbor + ")");

                double tentativeG = gScore[node] + edgeCost;
                PathAlgorithmsSupport.requireFiniteNonNegative(tentativeG, "tentativeG(" + node + "," + neighbor + ")");

                int cmp = Double.compare(tentativeG, gScore[neighbor]);
                if (cmp >= 0) return;

                gScore[neighbor] = tentativeG;
                parent[neighbor] = node;
                closed[neighbor] = false;

                double h = heuristic.estimate(neighbor, goalNodeId);
                PathAlgorithmsSupport.requireFiniteNonNegative(h, "heuristic(" + neighbor + ",goal)");
                double f = tentativeG + h;
                PathAlgorithmsSupport.requireFiniteNonNegative(f, "fScore(" + neighbor + ")");
                open.add(new State(neighbor, tentativeG, f, sequenceRef[0]++));
            });
        }

        return PathSearchResult.unreachable(visitedNodeCount);
    }

    private record State(int nodeId, double gScore, double fScore, long sequence) {
    }
}
