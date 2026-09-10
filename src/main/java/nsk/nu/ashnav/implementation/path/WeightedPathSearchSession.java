package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.path.IntHeuristic;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;

import java.util.Arrays;
import java.util.PriorityQueue;

final class WeightedPathSearchSession extends AbstractPathSearchSession {
    private final WeightedIntGraph graph;
    private final IntHeuristic heuristic;
    private final int startNodeId;
    private final int goalNodeId;
    private final int[] parent;
    private final double[] distance;
    private final boolean[] closed;
    private final boolean[] visited;
    private final PriorityQueue<State> open;
    private long sequence;

    WeightedPathSearchSession(WeightedIntGraph graph, IntHeuristic heuristic, int startNodeId, int goalNodeId) {
        PathAlgorithmsSupport.requireValidQuery(graph, startNodeId, goalNodeId);
        this.graph = graph;
        this.heuristic = heuristic;
        this.startNodeId = startNodeId;
        this.goalNodeId = goalNodeId;
        if (heuristic != null) {
            double goalEstimate = heuristic.estimate(goalNodeId, goalNodeId);
            PathAlgorithmsSupport.requireFiniteNonNegative(goalEstimate, "heuristic(goal,goal)");
            if (goalEstimate != 0.0) throw new IllegalStateException("heuristic(goal,goal) must be zero");
        }

        int nodeCount = graph.nodeCount();
        parent = PathAlgorithmsSupport.newParentArray(nodeCount);
        distance = new double[nodeCount];
        Arrays.fill(distance, Double.POSITIVE_INFINITY);
        closed = new boolean[nodeCount];
        visited = heuristic == null ? null : new boolean[nodeCount];
        open = new PriorityQueue<>((a, b) -> {
            int cmpPriority = Double.compare(a.priority, b.priority);
            if (cmpPriority != 0) return cmpPriority;
            if (heuristic != null) {
                int cmpDistance = Double.compare(a.distance, b.distance);
                if (cmpDistance != 0) return cmpDistance;
            }
            int cmpNode = Integer.compare(a.nodeId, b.nodeId);
            if (cmpNode != 0) return cmpNode;
            return Long.compare(a.sequence, b.sequence);
        });
        distance[startNodeId] = 0.0;
        open.add(new State(startNodeId, 0.0, estimate(startNodeId), sequence++));
    }

    @Override
    protected boolean queueEmpty() {
        return open.isEmpty();
    }

    @Override
    protected void processNext() {
        State current = open.remove();
        int node = current.nodeId;
        if (closed[node] || Double.compare(current.distance, distance[node]) > 0) return;

        closed[node] = true;
        expansionCount = Math.incrementExact(expansionCount);
        if (visited == null || !visited[node]) {
            if (visited != null) visited[node] = true;
            visitedNodeCount++;
        }
        if (node == goalNodeId) {
            PathResult path = PathAlgorithmsSupport.reconstructPath(parent, startNodeId, goalNodeId, distance[node]);
            complete(PathSearchResult.found(path, visitedNodeCount));
            return;
        }
        graph.forEachEdge(node, (neighbor, edgeCost) -> relax(node, neighbor, edgeCost));
    }

    private void relax(int node, int neighbor, double edgeCost) {
        PathAlgorithmsSupport.requireValidNeighbor(graph, node, neighbor);
        if (heuristic == null && closed[neighbor]) return;
        PathAlgorithmsSupport.requireFiniteNonNegative(edgeCost, "edgeCost", node, neighbor);
        double candidate = distance[node] + edgeCost;
        PathAlgorithmsSupport.requireFiniteNonNegative(candidate, "distance", node, neighbor);
        int cmp = Double.compare(candidate, distance[neighbor]);
        if (cmp > 0) return;
        if (cmp == 0 && (heuristic != null || !PathAlgorithmsSupport.betterParent(node, parent[neighbor]))) return;

        distance[neighbor] = candidate;
        parent[neighbor] = node;
        closed[neighbor] = false;
        double priority = candidate;
        if (heuristic != null) {
            priority += estimate(neighbor);
            PathAlgorithmsSupport.requireFiniteNonNegative(priority, "priority", neighbor, goalNodeId);
        }
        open.add(new State(neighbor, candidate, priority, sequence));
        sequence = Math.incrementExact(sequence);
    }

    private double estimate(int node) {
        if (heuristic == null) return 0.0;
        double value = heuristic.estimate(node, goalNodeId);
        PathAlgorithmsSupport.requireFiniteNonNegative(value, "heuristic", node, goalNodeId);
        return value;
    }

    private record State(int nodeId, double distance, double priority, long sequence) {
    }
}
