package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.ResumablePathfinder;

/**
 * Deterministic Dijkstra solver minimizing supplied finite non-negative costs.
 * Queue order is distance, node ID, then insertion sequence. Equal distances prefer
 * a smaller parent ID only before the destination is settled, not a lexicographically
 * smallest whole route. Graph state must remain stable throughout a query/session.
 * Non-finite evaluated costs or sums throw IllegalStateException; sums use rounded doubles.
 * With V nodes, E emitted edges and P queued states (at most E+1), time is
 * O(V+E+P log(1+P)) for O(1) work per emitted weighted edge; memory is O(V+P).
 * Default weighted iteration adds edgeCost lookup time; native weighted adjacency
 * iteration reads each pair once. Result storage is included in the memory bound.
 */
public final class DijkstraPathfinder implements ResumablePathfinder {
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
    public PathSearchSession startSearch(int startNodeId, int goalNodeId) {
        return new WeightedPathSearchSession(graph, null, startNodeId, goalNodeId);
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        return PathAlgorithmsSupport.finish(startSearch(startNodeId, goalNodeId));
    }
}
