package nsk.nu.ashnav.api.path;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class PathSearchResultTest {

    @Test
    void validatesStatusPathConsistency() {
        PathResult path = new PathResult(new int[]{0, 1}, 1.0);

        assertThrows(IllegalArgumentException.class, () -> new PathSearchResult(PathStatus.FOUND, null, 1));
        assertThrows(IllegalArgumentException.class, () -> new PathSearchResult(PathStatus.UNREACHABLE, path, 1));
    }

    @Test
    void factoryMethodsBuildConsistentInstances() {
        PathResult path = new PathResult(new int[]{0, 2, 3}, 4.0);

        PathSearchResult found = PathSearchResult.found(path, 7);
        assertEquals(PathStatus.FOUND, found.status());
        assertEquals(path, found.path());
        assertEquals(7, found.visitedNodeCount());

        PathSearchResult unreachable = PathSearchResult.unreachable(3);
        assertEquals(PathStatus.UNREACHABLE, unreachable.status());
        assertNull(unreachable.path());
        assertEquals(3, unreachable.visitedNodeCount());
    }
}
