package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.PathSearchState;
import nsk.nu.ashnav.api.path.PathStatus;

abstract class AbstractPathSearchSession implements PathSearchSession {
    private PathSearchState state = PathSearchState.IN_PROGRESS;
    private PathSearchResult result;
    private long queuePopCount;
    private boolean advancing;
    protected long expansionCount;
    protected int visitedNodeCount;

    @Override
    public final PathSearchState state() {
        return state;
    }

    @Override
    public final PathSearchState advance(int maxQueuePops) {
        if (maxQueuePops < 0) throw new IllegalArgumentException("maxQueuePops must be >= 0");
        if (advancing) throw new IllegalStateException("session is already advancing");
        if (maxQueuePops == 0 || state != PathSearchState.IN_PROGRESS) return state;
        advancing = true;
        try {
            for (int i = 0; i < maxQueuePops && state == PathSearchState.IN_PROGRESS; i++) {
                if (queueEmpty()) {
                    complete(PathSearchResult.unreachable(visitedNodeCount));
                    break;
                }
                queuePopCount = Math.incrementExact(queuePopCount);
                processNext();
                if (state == PathSearchState.IN_PROGRESS && queueEmpty()) {
                    complete(PathSearchResult.unreachable(visitedNodeCount));
                }
            }
        } catch (RuntimeException | Error failure) {
            state = PathSearchState.FAILED;
            throw failure;
        } finally {
            advancing = false;
        }
        return state;
    }

    @Override
    public final void cancel() {
        if (advancing) throw new IllegalStateException("cannot cancel during advance");
        if (state == PathSearchState.IN_PROGRESS) state = PathSearchState.CANCELLED;
    }

    @Override
    public final PathSearchResult result() {
        if (result == null) throw new IllegalStateException("session has no completed path result: " + state);
        return result;
    }

    @Override
    public final long queuePopCount() {
        return queuePopCount;
    }

    @Override
    public final long expansionCount() {
        return expansionCount;
    }

    protected final void complete(PathSearchResult result) {
        this.result = result;
        state = result.status() == PathStatus.FOUND ? PathSearchState.FOUND : PathSearchState.UNREACHABLE;
    }

    protected abstract boolean queueEmpty();

    protected abstract void processNext();
}
