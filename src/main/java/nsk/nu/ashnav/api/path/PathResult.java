package nsk.nu.ashnav.api.path;

import java.util.Arrays;

/**
 * Immutable path represented as a node-ID sequence with a total traversal cost.
 * The constructor and nodes() defensively copy the array in O(L) time and memory for L nodes.
 * totalCost means edge count for BFS, or a rounded sum of supplied edge costs for weighted solvers.
 * Node IDs refer to the source graph state; this value does not retain or monitor that graph.
 */
public record PathResult(int[] nodes, double totalCost) {

    public PathResult {
        if (nodes == null) {
            throw new NullPointerException("nodes");
        }
        if (!Double.isFinite(totalCost) || totalCost < 0.0) {
            throw new IllegalArgumentException("totalCost must be finite and >= 0");
        }
        for (int i = 0; i < nodes.length; i++) {
            if (nodes[i] < 0) {
                throw new IllegalArgumentException("nodes[" + i + "] must be >= 0");
            }
        }
        nodes = Arrays.copyOf(nodes, nodes.length);
    }

    @Override
    public int[] nodes() {
        return Arrays.copyOf(nodes, nodes.length);
    }

    /** Number of nodes in this path. */
    public int length() {
        return nodes.length;
    }

    /** Returns true when this path contains no nodes. */
    public boolean isEmpty() {
        return nodes.length == 0;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof PathResult other)) return false;
        return Double.compare(totalCost, other.totalCost) == 0 && Arrays.equals(nodes, other.nodes);
    }

    @Override
    public int hashCode() {
        int result = Arrays.hashCode(nodes);
        long bits = Double.doubleToLongBits(totalCost);
        result = 31 * result + (int) (bits ^ (bits >>> 32));
        return result;
    }

    @Override
    public String toString() {
        return "PathResult[nodes=" + Arrays.toString(nodes) + ", totalCost=" + totalCost + "]";
    }
}
