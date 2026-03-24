package nsk.nu.ashnav.api.graph;

import java.util.function.IntConsumer;

/**
 * Read-only directed graph with integer node identifiers.
 *
 * <p>Neighbor iteration order is deterministic and part of the contract:
 * for identical graph state, implementations must emit the same sequence.</p>
 */
public interface IntGraph {

    /** Number of nodes in this graph. Valid node range is {@code [0, nodeCount())}. */
    int nodeCount();

    /** Emits all outgoing neighbors for {@code nodeId} in deterministic order. */
    void forEachNeighbor(int nodeId, IntConsumer neighborConsumer);

    /** Returns true when {@code nodeId} is within {@code [0, nodeCount())}. */
    default boolean isValidNode(int nodeId) {
        return nodeId >= 0 && nodeId < nodeCount();
    }
}
