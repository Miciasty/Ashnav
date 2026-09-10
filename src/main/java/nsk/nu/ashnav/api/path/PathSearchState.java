package nsk.nu.ashnav.api.path;

/** Session state, separate from a completed path's FOUND/UNREACHABLE status. */
public enum PathSearchState {
    IN_PROGRESS,
    FOUND,
    UNREACHABLE,
    CANCELLED,
    FAILED
}
