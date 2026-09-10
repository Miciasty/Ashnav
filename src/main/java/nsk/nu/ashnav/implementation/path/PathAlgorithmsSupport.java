package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.path.PathResult;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.PathSearchState;

import java.util.Arrays;

final class PathAlgorithmsSupport {
    private PathAlgorithmsSupport() {
    }

    static PathSearchResult finish(PathSearchSession session) {
        while (session.state() == PathSearchState.IN_PROGRESS) {
            session.advance(Integer.MAX_VALUE);
        }
        return session.result();
    }

    static void requireValidQuery(IntGraph graph, int startNodeId, int goalNodeId) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        if (!graph.isValidNode(startNodeId)) {
            throw new IllegalArgumentException("startNodeId out of range: " + startNodeId);
        }
        if (!graph.isValidNode(goalNodeId)) {
            throw new IllegalArgumentException("goalNodeId out of range: " + goalNodeId);
        }
    }

    static void requireValidNeighbor(IntGraph graph, int fromNodeId, int neighborNodeId) {
        if (!graph.isValidNode(neighborNodeId)) {
            throw new IllegalStateException(
                    "Graph emitted invalid neighbor " + neighborNodeId + " from node " + fromNodeId
            );
        }
    }

    static void requireFiniteNonNegative(double value, String name) {
        if (!Double.isFinite(value) || value < 0.0) {
            throw new IllegalStateException(name + " must be finite and >= 0");
        }
    }

    static void requireFiniteNonNegative(double value, String name, int fromNodeId, int toNodeId) {
        if (Double.isFinite(value) && value >= 0.0) return;
        throw new IllegalStateException(name + "(" + fromNodeId + "," + toNodeId + ") must be finite and >= 0");
    }

    static boolean betterParent(int candidateParent, int existingParent) {
        return existingParent < 0 || candidateParent < existingParent;
    }

    static PathResult reconstructPath(int[] parent, int startNodeId, int goalNodeId, double totalCost) {
        if (startNodeId == goalNodeId) {
            return new PathResult(new int[]{startNodeId}, totalCost);
        }

        int pathLength = 1;
        int cursor = goalNodeId;
        int guard = 0;
        while (cursor != startNodeId) {
            cursor = requireParent(parent, cursor);
            pathLength++;
            guard = incrementGuard(guard, parent.length);
        }

        int[] path = new int[pathLength];
        cursor = goalNodeId;
        for (int i = pathLength - 1; i >= 0; i--) {
            path[i] = cursor;
            if (cursor == startNodeId) {
                break;
            }
            cursor = parent[cursor];
        }
        return new PathResult(path, totalCost);
    }

    static int[] newParentArray(int size) {
        int[] parent = new int[size];
        Arrays.fill(parent, -1);
        return parent;
    }

    private static int requireParent(int[] parent, int nodeId) {
        int parentNodeId = parent[nodeId];
        if (parentNodeId >= 0) return parentNodeId;
        throw new IllegalStateException("Path reconstruction failed: broken parent chain");
    }

    private static int incrementGuard(int guard, int limit) {
        int nextGuard = guard + 1;
        if (nextGuard <= limit) return nextGuard;
        throw new IllegalStateException("Path reconstruction failed: cycle in parent chain");
    }
}
