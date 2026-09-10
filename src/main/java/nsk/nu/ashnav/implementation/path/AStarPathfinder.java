package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.path.IntHeuristic;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.ResumablePathfinder;

/**
 * Deterministic A* solver that reopens a node when a strictly cheaper route is found.
 * Optimality requires an admissible heuristic in edge-cost units and h(goal)=0;
 * consistency is not required. Local numeric validation cannot prove admissibility.
 * Equal-cost routes retain the first discovered parent, avoiding zero-cost parent cycles.
 * Queue order is f score, g score, node ID, then insertion sequence.
 * Graph and heuristic must remain stable throughout a query/session, including pauses.
 * Non-finite evaluated costs, estimates or sums throw IllegalStateException.
 * Uses rounded double arithmetic without a tolerance. With V nodes, A emitted edges
 * across expansions, P queued states and H heuristic work, time is O(V+A+P log(1+P)+H)
 * for O(1) work per emitted weighted edge; memory is O(V+P), including the result.
 * Reopening can make A and P much larger than the graph's edge count. Default edge
 * iteration may add lookup costs; native weighted adjacency iteration avoids row rescans.
 */
public final class AStarPathfinder implements ResumablePathfinder {
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
    public PathSearchSession startSearch(int startNodeId, int goalNodeId) {
        return new WeightedPathSearchSession(graph, heuristic, startNodeId, goalNodeId);
    }

    @Override
    public PathSearchResult findPath(int startNodeId, int goalNodeId) {
        return PathAlgorithmsSupport.finish(startSearch(startNodeId, goalNodeId));
    }
}
