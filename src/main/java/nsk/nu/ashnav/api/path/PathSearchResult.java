package nsk.nu.ashnav.api.path;

/**
 * Deterministic shortest-path query result.
 * visitedNodeCount counts distinct nodes removed for processing, including a found goal;
 * repeated A* expansions count once. It is not the queue insertion or expansion count.
 * UNREACHABLE carries a null path. Grid bridges can return unreachable(0) for missing endpoints.
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
