package nsk.nu.ashnav.implementation.graph;

import nsk.nu.ashnav.api.graph.IntEdgeCost;
import nsk.nu.ashnav.api.graph.IntEdgePredicate;
import nsk.nu.ashnav.api.graph.IntWeightedEdgeConsumer;
import nsk.nu.ashnav.api.graph.WeightedIntGraph;

import java.util.function.IntConsumer;

/**
 * Live graph view that filters directed edges and replaces their costs without renumbering nodes.
 * The base graph and both policies are retained, not copied; keep them and any captured data
 * stable for a complete query/session. A grid mapping for the base also maps this view's IDs.
 * No game-specific movement rules are inferred. Duplicate/order semantics follow the base.
 * Construction uses O(1) time/memory. Iteration costs the base iteration plus policy/consumer
 * work per edge; rejected edges do not call the cost policy. BFS does not call the cost policy.
 */
public final class PolicyWeightedIntGraph implements WeightedIntGraph {
    private final WeightedIntGraph graph;
    private final IntEdgePredicate allowed;
    private final IntEdgeCost cost;

    public PolicyWeightedIntGraph(WeightedIntGraph graph, IntEdgePredicate allowed, IntEdgeCost cost) {
        if (graph == null) throw new NullPointerException("graph");
        if (allowed == null) throw new NullPointerException("allowed");
        if (cost == null) throw new NullPointerException("cost");
        this.graph = graph;
        this.allowed = allowed;
        this.cost = cost;
    }

    @Override
    public int nodeCount() {
        return graph.nodeCount();
    }

    @Override
    public void forEachNeighbor(int nodeId, IntConsumer neighborConsumer) {
        if (neighborConsumer == null) throw new NullPointerException("neighborConsumer");
        graph.forEachNeighbor(nodeId, neighbor -> {
            if (allowed.test(nodeId, neighbor)) neighborConsumer.accept(neighbor);
        });
    }

    @Override
    public void forEachEdge(int nodeId, IntWeightedEdgeConsumer edgeConsumer) {
        if (edgeConsumer == null) throw new NullPointerException("edgeConsumer");
        graph.forEachEdge(nodeId, (neighbor, baseCost) -> {
            if (allowed.test(nodeId, neighbor)) {
                edgeConsumer.accept(neighbor, mappedCost(nodeId, neighbor, baseCost));
            }
        });
    }

    @Override
    public double edgeCost(int fromNodeId, int toNodeId) {
        double baseCost = graph.edgeCost(fromNodeId, toNodeId);
        if (!allowed.test(fromNodeId, toNodeId)) {
            throw new IllegalArgumentException("No directed edge " + fromNodeId + " -> " + toNodeId);
        }
        return mappedCost(fromNodeId, toNodeId, baseCost);
    }

    private double mappedCost(int fromNodeId, int toNodeId, double baseCost) {
        double value = cost.cost(fromNodeId, toNodeId, baseCost);
        if (!Double.isFinite(value) || value < 0.0) {
            throw new IllegalStateException("policy cost must be finite and >= 0");
        }
        return value;
    }
}
