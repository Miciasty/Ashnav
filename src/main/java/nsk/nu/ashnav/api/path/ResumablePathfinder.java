package nsk.nu.ashnav.api.path;

/** A graph-bound solver that can retain query state between caller-controlled steps. */
public interface ResumablePathfinder extends GraphPathfinder {

    /**
     * Validates IDs and creates an independent IN_PROGRESS session. Built-in solvers allocate
     * and initialize O(V) state here, outside advance's budget; A* also evaluates initial estimates.
     */
    PathSearchSession startSearch(int startNodeId, int goalNodeId);
}
