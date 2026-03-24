package nsk.nu.ashnav.implementation.graph;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;

import java.util.Arrays;
import java.util.function.IntConsumer;

/**
 * Dense weighted adjacency-list graph backed by {@code int[][]} and {@code double[][]}.
 */
public final class WeightedAdjacencyIntGraph implements WeightedIntGraph {
    private final int[][] neighbors;
    private final double[][] costs;

    public WeightedAdjacencyIntGraph(int[][] neighbors, double[][] costs) {
        requireMatrixInputs(neighbors, costs);

        int nodeCount = neighbors.length;
        this.neighbors = new int[nodeCount][];
        this.costs = new double[nodeCount][];

        for (int nodeId = 0; nodeId < nodeCount; nodeId++) {
            Row row = copyValidatedRow(neighbors, costs, nodeId, nodeCount);
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
