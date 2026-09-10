package nsk.nu.ashnav.api.graph;

/** Receives a neighbor and the cost of the edge to it, synchronously in graph order. */
@FunctionalInterface
public interface IntWeightedEdgeConsumer {
    void accept(int neighborNodeId, double cost);
}
