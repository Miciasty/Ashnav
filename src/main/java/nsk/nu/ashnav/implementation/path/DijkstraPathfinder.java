package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.path.GraphPathfinder;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;

import java.util.Arrays;
import java.util.PriorityQueue;

/**
 * Deterministic Dijkstra shortest-path solver for non-negative weighted graphs.
 * Queue order is distance, node ID, then insertion sequence. Equal distances prefer
 * a smaller parent ID only before the destination node is settled, not a lexicographically
 * smallest whole route. Graph state must remain stable throughout the query.
 * Non-finite evaluated costs or sums throw IllegalStateException; sums use rounded double arithmetic.
 * For V nodes, E neighbor emissions and P queued states (at most E+1), time is
 * O(V+E+P log(1+P)) plus edge-cost lookup time, assuming O(degree) iteration and O(1) node checks.
 * Memory is O(V+P), including the result. Linear row lookups add O(sum(degree(v)^2)) time.
 */
public final class DijkstraPathfinder implements GraphPathfinder {
    private final WeightedIntGraph graph;

    public DijkstraPathfinder(WeightedIntGraph graph) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        this.graph = graph;
    }

    @Override
    public WeightedIntGraph graph() {
        return graph;
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        PathAlgorithmsSupport.requireValidQuery(graph, startNodeId, goalNodeId);

        int nodeCount = graph.nodeCount();
        int[] parent = PathAlgorithmsSupport.newParentArray(nodeCount);
        double[] distance = new double[nodeCount];
        Arrays.fill(distance, Double.POSITIVE_INFINITY);
        boolean[] settled = new boolean[nodeCount];

        long[] sequenceRef = new long[]{0L};
        PriorityQueue<State> open = new PriorityQueue<>(
                (a, b) -> {
                    int cmpDistance = Double.compare(a.distance, b.distance);
                    if (cmpDistance != 0) return cmpDistance;
                    int cmpNode = Integer.compare(a.nodeId, b.nodeId);
                    if (cmpNode != 0) return cmpNode;
                    return Long.compare(a.sequence, b.sequence);
                }
        );

        distance[startNodeId] = 0.0;
        open.add(new State(startNodeId, 0.0, sequenceRef[0]++));

        int visitedNodeCount = 0;
        while (!open.isEmpty()) {
            State current = open.poll();
            int node = current.nodeId;

            if (settled[node]) {
                continue;
            }
            if (Double.compare(current.distance, distance[node]) > 0) {
                continue;
            }

            settled[node] = true;
            visitedNodeCount++;

            if (node == goalNodeId) {
                PathResult path = PathAlgorithmsSupport.reconstructPath(
                        parent,
                        startNodeId,
                        goalNodeId,
                        distance[goalNodeId]
                );
                return PathSearchResult.found(path, visitedNodeCount);
            }

            graph.forEachNeighbor(node, neighbor -> {
                PathAlgorithmsSupport.requireValidNeighbor(graph, node, neighbor);
                if (settled[neighbor]) {
                    return;
                }

                double edgeCost = graph.edgeCost(node, neighbor);
                PathAlgorithmsSupport.requireFiniteNonNegative(edgeCost, "edgeCost(" + node + "," + neighbor + ")");

                double candidateDistance = distance[node] + edgeCost;
                PathAlgorithmsSupport.requireFiniteNonNegative(
                        candidateDistance,
                        "candidateDistance(" + node + "," + neighbor + ")"
                );

                int cmp = Double.compare(candidateDistance, distance[neighbor]);
                if (cmp > 0) return;
                if (cmp == 0 && !PathAlgorithmsSupport.betterParent(node, parent[neighbor])) return;

                distance[neighbor] = candidateDistance;
                parent[neighbor] = node;
                open.add(new State(neighbor, candidateDistance, sequenceRef[0]++));
            });
        }

        return PathSearchResult.unreachable(visitedNodeCount);
    }

    private record State(int nodeId, double distance, long sequence) {
    }
}
