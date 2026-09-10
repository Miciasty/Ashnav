package nsk.nu.ashnav.api.graph;

/** Stable edge-cost rule. Returns a finite non-negative cost in one common unit. */
@FunctionalInterface
public interface IntEdgeCost {
    double cost(int fromNodeId, int toNodeId, double baseCost);
}
