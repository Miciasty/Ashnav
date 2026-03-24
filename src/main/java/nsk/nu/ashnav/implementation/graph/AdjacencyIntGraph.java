package nsk.nu.ashnav.implementation.graph;

import nsk.nu.ashnav.api.graph.IntGraph;

import java.util.Arrays;
import java.util.function.IntConsumer;

/**
 * Dense adjacency-list graph backed by {@code int[][]}.
 */
public final class AdjacencyIntGraph implements IntGraph {
    private final int[][] adjacency;

    public AdjacencyIntGraph(int[][] adjacency) {
        if (adjacency == null) {
            throw new NullPointerException("adjacency");
        }

        int nodeCount = adjacency.length;
        this.adjacency = new int[nodeCount][];

        for (int nodeId = 0; nodeId < nodeCount; nodeId++) {
            this.adjacency[nodeId] = copyValidatedRow(adjacency, nodeId, nodeCount);
        }
    }

    @Override
    public int nodeCount() {
        return adjacency.length;
    }

    @Override
    public void forEachNeighbor(int nodeId, IntConsumer neighborConsumer) {
        if (neighborConsumer == null) {
            throw new NullPointerException("neighborConsumer");
        }
        if (!isValidNode(nodeId)) {
            throw new IllegalArgumentException("nodeId out of range: " + nodeId);
        }

        int[] neighbors = adjacency[nodeId];
        for (int i = 0; i < neighbors.length; i++) {
            neighborConsumer.accept(neighbors[i]);
        }
    }

    private static int[] copyValidatedRow(int[][] adjacency, int nodeId, int nodeCount) {
        int[] neighbors = adjacency[nodeId];
        if (neighbors == null) {
            throw new NullPointerException("adjacency[" + nodeId + "]");
        }

        int[] copy = Arrays.copyOf(neighbors, neighbors.length);
        validateNeighborRange(copy, nodeId, nodeCount);
        return copy;
    }

    private static void validateNeighborRange(int[] neighbors, int nodeId, int nodeCount) {
        for (int i = 0; i < neighbors.length; i++) {
            int neighborId = neighbors[i];
            if (neighborId >= 0 && neighborId < nodeCount) continue;
            throw new IllegalArgumentException(
                    "adjacency[" + nodeId + "][" + i + "] out of range: " + neighborId
            );
        }
    }
}
