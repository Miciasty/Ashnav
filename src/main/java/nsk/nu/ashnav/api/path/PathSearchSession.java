package nsk.nu.ashnav.api.path;

/**
 * Mutable, thread-confined search. Graph, costs and heuristic must remain stable from creation
 * until completion, including pauses. A session neither schedules work nor snapshots its graph.
 * Drop the session to release its working arrays/queue; immutable results remain usable.
 */
public interface PathSearchSession {
    PathSearchState state();

    /**
     * Processes at most maxQueuePops queue removals, including stale entries. Zero polls state;
     * a negative budget throws IllegalArgumentException even after completion. A whole outgoing
     * row is processed atomically. This is a deterministic work budget, not a time/memory limit:
     * callbacks, a high-degree row and final O(L) path reconstruction can take substantial time.
     * Exhausting the budget returns IN_PROGRESS, never UNREACHABLE. Terminal calls do no work.
     * Do not invoke advance/cancel reentrantly or concurrently. A callback failure is rethrown
     * and marks the session FAILED; a failed session cannot resume.
     */
    PathSearchState advance(int maxQueuePops);

    /** Cancels between steps; terminal sessions are unchanged. No partial path is fabricated. */
    void cancel();

    /** Returns the immutable result only for FOUND/UNREACHABLE, otherwise throws IllegalStateException. */
    PathSearchResult result();

    /** Cumulative queue removals, including stale entries. */
    long queuePopCount();

    /** Cumulative processed non-stale nodes, including a found goal and repeated A* expansions. */
    long expansionCount();
}
