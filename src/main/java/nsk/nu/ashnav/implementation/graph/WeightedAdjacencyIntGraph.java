package nsk.nu.ashnav.implementation.graph;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.graph.IntWeightedEdgeConsumer;

import java.util.Arrays;
import java.util.function.IntConsumer;

/**
 * Dense weighted adjacency-list graph backed by {@code int[][]} and {@code double[][]}.
 * Construction copies all rows in O(V+E) time/storage; later caller array mutations have no effect.
 * Row order and duplicate emissions are preserved. For repeated neighbor IDs the first
 * matching cost wins, regardless of later costs: [1,1]/[10,1] has edge cost 10.
 * This compatibility rule does not model parallel edges; merge by minimum cost before
 * construction if that is the intended model. Every supplied cost must still be valid.
 * Self-loops and zero costs are allowed. forEachNeighbor takes O(d) plus callback time,
 * and edgeCost takes O(d), where d is the row length including duplicates.
 * forEachEdge reads each pair directly in O(d), without repeated cost lookups.
 */
public final class WeightedAdjacencyIntGraph implements WeightedIntGraph {
    private final int[][] neighbors;
    private final double[][] costs;

    public WeightedAdjacencyIntGraph(int[][] neighbors, double[][] costs) {
        requireMatrixInputs(neighbors, costs);

        int nodeCount = neighbors.length;
        this.neighbors = new int[nodeCount][];
        this.costs = new double[nodeCount][];
        int[] seenFrom = new int[nodeCount];
        Arrays.fill(seenFrom, -1);
        double[] firstCost = new double[nodeCount];

        for (int nodeId = 0; nodeId < nodeCount; nodeId++) {
            Row row = copyValidatedRow(neighbors, costs, nodeId, nodeCount);
            for (int i = 0; i < row.neighbors.length; i++) {
                int neighbor = row.neighbors[i];
                if (seenFrom[neighbor] == nodeId) {
                    row.costs[i] = firstCost[neighbor];
                } else {
                    seenFrom[neighbor] = nodeId;
                    firstCost[neighbor] = row.costs[i];
                }
            }
            this.neighbors[nodeId] = row.neighbors;
            this.costs[nodeId] = row.costs;
        }
    }

    @Override
    public int nodeCount() {
        return neighbors.length;
    }

    @Override
    public void forEachNeighbor(int nodeId, IntConsumer neighborConsumer) {
        if (neighborConsumer == null) {
            throw new NullPointerException("neighborConsumer");
        }
        if (!isValidNode(nodeId)) {
            throw new IllegalArgumentException("nodeId out of range: " + nodeId);
        }

        int[] row = neighbors[nodeId];
        for (int i = 0; i < row.length; i++) {
            neighborConsumer.accept(row[i]);
        }
    }

    @Override
    public void forEachEdge(int nodeId, IntWeightedEdgeConsumer edgeConsumer) {
        if (edgeConsumer == null) throw new NullPointerException("edgeConsumer");
        if (!isValidNode(nodeId)) throw new IllegalArgumentException("nodeId out of range: " + nodeId);
        int[] row = neighbors[nodeId];
        double[] rowCosts = costs[nodeId];
        for (int i = 0; i < row.length; i++) {
            edgeConsumer.accept(row[i], rowCosts[i]);
        }
    }

    @Override
    public double edgeCost(int fromNodeId, int toNodeId) {
        if (!isValidNode(fromNodeId)) {
            throw new IllegalArgumentException("fromNodeId out of range: " + fromNodeId);
        }
        if (!isValidNode(toNodeId)) {
            throw new IllegalArgumentException("toNodeId out of range: " + toNodeId);
        }

        int[] rowNeighbors = neighbors[fromNodeId];
        double[] rowCosts = costs[fromNodeId];
        for (int i = 0; i < rowNeighbors.length; i++) {
            if (rowNeighbors[i] != toNodeId) continue;
            return rowCosts[i];
        }
        throw new IllegalArgumentException("No directed edge " + fromNodeId + " -> " + toNodeId);
    }

    private static void requireMatrixInputs(int[][] neighbors, double[][] costs) {
        if (neighbors == null) throw new NullPointerException("neighbors");
        if (costs == null) throw new NullPointerException("costs");
        if (neighbors.length == costs.length) return;
        throw new IllegalArgumentException("neighbors and costs length mismatch");
    }

    private static Row copyValidatedRow(int[][] neighbors, double[][] costs, int nodeId, int nodeCount) {
        int[] rowNeighbors = neighbors[nodeId];
        double[] rowCosts = costs[nodeId];
        if (rowNeighbors == null) throw new NullPointerException("neighbors[" + nodeId + "]");
        if (rowCosts == null) throw new NullPointerException("costs[" + nodeId + "]");
        if (rowNeighbors.length != rowCosts.length) {
            throw new IllegalArgumentException("neighbors/costs row length mismatch at node " + nodeId);
        }

        int[] neighborsCopy = Arrays.copyOf(rowNeighbors, rowNeighbors.length);
        double[] costsCopy = Arrays.copyOf(rowCosts, rowCosts.length);
        validateEdges(neighborsCopy, costsCopy, nodeId, nodeCount);
        return new Row(neighborsCopy, costsCopy);
    }

    private static void validateEdges(int[] neighbors, double[] costs, int nodeId, int nodeCount) {
        for (int i = 0; i < neighbors.length; i++) {
            int neighborId = neighbors[i];
            if (neighborId < 0 || neighborId >= nodeCount) {
                throw new IllegalArgumentException(
                        "neighbors[" + nodeId + "][" + i + "] out of range: " + neighborId
                );
            }

            double edgeCost = costs[i];
            if (Double.isFinite(edgeCost) && edgeCost >= 0.0) continue;
            throw new IllegalArgumentException(
                    "costs[" + nodeId + "][" + i + "] must be finite and >= 0"
            );
        }
    }

    private record Row(int[] neighbors, double[] costs) {
    }
}
