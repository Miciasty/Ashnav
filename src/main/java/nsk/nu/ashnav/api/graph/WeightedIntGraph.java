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

    /**
     * Emits the same neighbor sequence as forEachNeighbor, paired with edgeCost values.
     * Duplicate neighbors must carry the same pair cost, including first-entry semantics
     * in WeightedAdjacencyIntGraph. The consumer is synchronous and must not be retained.
     * This compatibility default uses one edgeCost lookup per emission. Implementations
     * may override it to read neighbors and costs together, preserving order and values.
     * Cost is iteration plus all lookups/callbacks; a null consumer is rejected.
     */
    default void forEachEdge(int nodeId, IntWeightedEdgeConsumer edgeConsumer) {
        if (edgeConsumer == null) throw new NullPointerException("edgeConsumer");
        forEachNeighbor(nodeId, neighbor -> edgeConsumer.accept(neighbor, edgeCost(nodeId, neighbor)));
    }
}
