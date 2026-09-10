package nsk.nu.ashnav.api.graph;

import java.util.function.IntConsumer;

/**
 * Read-only directed graph with integer node identifiers.
 *
 * <p>Neighbor iteration order is deterministic and part of the contract:
 * for identical graph state, implementations must emit the same sequence.</p>
 * <p>Node count must be non-negative. Counts, connectivity and ordering must remain stable
 * during a query; this read-only interface does not freeze a mutable implementation.
 * Duplicate neighbor emissions and self-loops are allowed. Ordering, including duplicates,
 * is part of the input. Built-in adjacency graphs copy their input rows.</p>
 */
public interface IntGraph {

    /** Number of nodes in this graph. Valid node range is {@code [0, nodeCount())}. */
    int nodeCount();

    /** Emits valid outgoing neighbors synchronously in deterministic order; must not retain the consumer. */
    void forEachNeighbor(int nodeId, IntConsumer neighborConsumer);

    /** Returns true when {@code nodeId} is within {@code [0, nodeCount())}. */
    default boolean isValidNode(int nodeId) {
        return nodeId >= 0 && nodeId < nodeCount();
    }
}
