package nsk.nu.ashnav.api.path;

/**
 * Deterministic shortest-path query result.
 */
public record PathSearchResult(PathStatus status, PathResult path, int visitedNodeCount) {

    public PathSearchResult {
        if (status == null) {
            throw new NullPointerException("status");
        }
        if (visitedNodeCount < 0) {
            throw new IllegalArgumentException("visitedNodeCount must be >= 0");
        }
        if (status == PathStatus.FOUND && path == null) {
            throw new IllegalArgumentException("path is required for FOUND status");
        }
        if (status == PathStatus.UNREACHABLE && path != null) {
            throw new IllegalArgumentException("path must be null for UNREACHABLE status");
        }
    }

    public static PathSearchResult found(PathResult path, int visitedNodeCount) {
        return new PathSearchResult(PathStatus.FOUND, path, visitedNodeCount);
    }

    public static PathSearchResult unreachable(int visitedNodeCount) {
        return new PathSearchResult(PathStatus.UNREACHABLE, null, visitedNodeCount);
    }
}
