package nsk.nu.ashnav.api.graph;

/**
 * Directed graph with non-negative edge costs.
 */
public interface WeightedIntGraph extends IntGraph {

    /**
     * Cost of traversing directed edge {@code fromNodeId -> toNodeId}.
     *
     * <p>Implementations must return a finite value greater than or equal to zero.</p>
     */
    double edgeCost(int fromNodeId, int toNodeId);
}
