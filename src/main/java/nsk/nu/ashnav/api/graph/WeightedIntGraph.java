package nsk.nu.ashnav.api.graph;

/**
 * Directed graph with non-negative edge costs.
 * An edge is identified by its ordered pair of nodes. Repeated emissions of a neighbor
 * represent the same edge/cost, not separate parallel edges. Costs must remain stable
 * throughout the query and use a common caller-defined unit.
 */
public interface WeightedIntGraph extends IntGraph {

    /**
     * Cost of traversing directed edge {@code fromNodeId -> toNodeId}.
     *
     * <p>Implementations must return a finite value greater than or equal to zero for an
     * emitted edge. Built-in graphs reject absent edges and invalid IDs with
     * IllegalArgumentException. Query complexity must include this method's lookup cost.</p>
     */
    double edgeCost(int fromNodeId, int toNodeId);
}
