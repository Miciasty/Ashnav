package nsk.nu.ashnav.api.path;

/**
 * Heuristic estimator used by informed shortest-path algorithms.
 */
@FunctionalInterface
public interface IntHeuristic {

    /**
     * Returns estimated remaining cost from {@code nodeId} to {@code goalNodeId}.
     *
     * <p>Values must be stable, finite, non-negative and use the same units as edge costs.
     * For A* optimality, the estimate must never exceed the cheapest remaining cost
     * (admissibility), and estimate(goal,goal) must be zero. An inconsistent but admissible
     * estimate is supported by reopening nodes. Consistency is the stronger condition
     * h(u) &lt;= cost(u,v)+h(v) for every edge. Zero everywhere is a safe default.</p>
     * <p>A* checks evaluated numeric values and the goal estimate. It cannot locally prove
     * admissibility or consistency. Overestimates may produce a more expensive route.</p>
     */
    double estimate(int nodeId, int goalNodeId);
}
