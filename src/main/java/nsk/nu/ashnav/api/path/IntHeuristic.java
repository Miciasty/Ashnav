package nsk.nu.ashnav.api.path;

/**
 * Heuristic estimator used by informed shortest-path algorithms.
 */
@FunctionalInterface
public interface IntHeuristic {

    /**
     * Returns estimated remaining cost from {@code nodeId} to {@code goalNodeId}.
     *
     * <p>The value must be finite and greater than or equal to zero.</p>
     */
    double estimate(int nodeId, int goalNodeId);
}
