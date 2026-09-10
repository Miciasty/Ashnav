package nsk.nu.ashnav.api.graph;

/** Stable directed-edge acceptance rule; IDs belong to the wrapped graph. */
@FunctionalInterface
public interface IntEdgePredicate {
    boolean test(int fromNodeId, int toNodeId);
}
