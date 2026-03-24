package nsk.nu.ashnav.api.path;

/**
 * Deterministic shortest-path solver contract.
 */
@FunctionalInterface
public interface Pathfinder {

    /**
     * Solves path query from {@code startNodeId} to {@code goalNodeId}.
     */
    PathSearchResult findPath(int startNodeId, int goalNodeId);
}
