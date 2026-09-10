package nsk.nu.ashnav.api.path;

/**
 * Deterministic shortest-path solver contract.
 * Node IDs belong to the solver's graph, not a global coordinate system.
 * The graph, its ordering, costs and heuristic/callback behavior must remain stable
 * during each complete query. Built-in solvers keep query state local, so concurrent
 * queries require safely shared graph data and thread-safe callbacks.
 */
@FunctionalInterface
public interface Pathfinder {

    /**
     * Solves path query from {@code startNodeId} to {@code goalNodeId}.
     * Built-in solvers reject invalid IDs with IllegalArgumentException and emitted invalid
     * neighbors or evaluated invalid costs/estimates with IllegalStateException.
     * A valid query with no route returns UNREACHABLE. This blocking operation runs to completion;
     * ResumablePathfinder.startSearch provides separately budgeted and cancellable sessions.
     * Weighted solvers require finite sums (overflow throws IllegalStateException).
     * Results contain copied node IDs valid for the queried graph state; world changes
     * do not automatically invalidate or repair the returned route.
     */
    PathSearchResult findPath(int startNodeId, int goalNodeId);
}
