package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.Pathfinder;

import java.util.ArrayDeque;

/**
 * Deterministic shortest-path solver for unweighted graphs.
 */
public final class BfsPathfinder implements Pathfinder {
    private final IntGraph graph;

    public BfsPathfinder(IntGraph graph) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        this.graph = graph;
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        PathAlgorithmsSupport.requireValidQuery(graph, startNodeId, goalNodeId);

        if (startNodeId == goalNodeId) {
            PathResult path = new PathResult(new int[]{startNodeId}, 0.0);
            return PathSearchResult.found(path, 1);
        }

        int nodeCount = graph.nodeCount();
        boolean[] discovered = new boolean[nodeCount];
        int[] parent = PathAlgorithmsSupport.newParentArray(nodeCount);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        discovered[startNodeId] = true;
        queue.add(startNodeId);

        int visitedNodeCount = 0;
        while (!queue.isEmpty()) {
            int current = queue.removeFirst();
            visitedNodeCount++;

            if (current == goalNodeId) {
                PathResult path = PathAlgorithmsSupport.reconstructPath(parent, startNodeId, goalNodeId, 0.0);
                double totalCost = path.length() - 1;
                return PathSearchResult.found(new PathResult(path.nodes(), totalCost), visitedNodeCount);
            }

            graph.forEachNeighbor(current, neighbor -> {
                PathAlgorithmsSupport.requireValidNeighbor(graph, current, neighbor);
                if (discovered[neighbor]) return;
                discovered[neighbor] = true;
                parent[neighbor] = current;
                queue.addLast(neighbor);
            });
        }

        return PathSearchResult.unreachable(visitedNodeCount);
    }
}
