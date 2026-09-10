package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;

import java.util.ArrayDeque;

final class BfsPathSearchSession extends AbstractPathSearchSession {
    private final IntGraph graph;
    private final int startNodeId;
    private final int goalNodeId;
    private final boolean[] discovered;
    private final int[] parent;
    private final ArrayDeque<Integer> queue = new ArrayDeque<>();

    BfsPathSearchSession(IntGraph graph, int startNodeId, int goalNodeId) {
        PathAlgorithmsSupport.requireValidQuery(graph, startNodeId, goalNodeId);
        this.graph = graph;
        this.startNodeId = startNodeId;
        this.goalNodeId = goalNodeId;
        int nodeCount = startNodeId == goalNodeId ? 0 : graph.nodeCount();
        discovered = new boolean[nodeCount];
        parent = PathAlgorithmsSupport.newParentArray(nodeCount);
        if (nodeCount > 0) discovered[startNodeId] = true;
        queue.add(startNodeId);
    }

    @Override
    protected boolean queueEmpty() {
        return queue.isEmpty();
    }

    @Override
    protected void processNext() {
        int current = queue.removeFirst();
        expansionCount = Math.incrementExact(expansionCount);
        visitedNodeCount++;
        if (current == goalNodeId) {
            PathResult path = PathAlgorithmsSupport.reconstructPath(parent, startNodeId, goalNodeId, 0.0);
            complete(PathSearchResult.found(new PathResult(path.nodes(), path.length() - 1), visitedNodeCount));
            return;
        }
        graph.forEachNeighbor(current, neighbor -> {
            PathAlgorithmsSupport.requireValidNeighbor(graph, current, neighbor);
            if (discovered[neighbor]) return;
            discovered[neighbor] = true;
            parent[neighbor] = current;
            queue.addLast(neighbor);
        });
    }
}
