package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.ResumablePathfinder;

/**
 * Deterministic solver minimizing edge count, including on a weighted graph.
 * totalCost is the number of edges; supplied weights are never read.
 * Equal-length routes keep the first discovered parent in neighbor iteration order.
 * For V nodes and E emitted edges, time is O(V+E) and memory O(V), including the result,
 * assuming O(1) node checks and O(degree) neighbor iteration. Trivial queries use O(1).
 * Graph state must remain stable throughout a query/session, including pauses.
 */
public final class BfsPathfinder implements ResumablePathfinder {
    private final IntGraph graph;

    public BfsPathfinder(IntGraph graph) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        this.graph = graph;
    }

    @Override
    public IntGraph graph() {
        return graph;
    }

    @Override
    public PathSearchSession startSearch(int startNodeId, int goalNodeId) {
        return new BfsPathSearchSession(graph, startNodeId, goalNodeId);
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        return PathAlgorithmsSupport.finish(startSearch(startNodeId, goalNodeId));
    }
}
