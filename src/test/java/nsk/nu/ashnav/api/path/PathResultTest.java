package nsk.nu.ashnav.api.path;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class PathResultTest {

    @Test
    void constructorCopiesInputArray() {
        int[] raw = {0, 2, 4};

        PathResult result = new PathResult(raw, 7.5);
        raw[1] = 99;

        assertArrayEquals(new int[]{0, 2, 4}, result.nodes());
    }

    @Test
    void nodesAccessorReturnsDefensiveCopy() {
        PathResult result = new PathResult(new int[]{0, 1, 2}, 3.0);

        int[] exported = result.nodes();
        exported[0] = 42;

        assertArrayEquals(new int[]{0, 1, 2}, result.nodes());
    }

    @Test
    void rejectsNegativeNodeIds() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PathResult(new int[]{0, -1}, 1.0)
        );
        assertTrue(exception.getMessage().contains("must be >= 0"));
    }

    @Test
    void rejectsInvalidTotalCost() {
        assertThrows(IllegalArgumentException.class, () -> new PathResult(new int[]{0}, -0.1));
        assertThrows(IllegalArgumentException.class, () -> new PathResult(new int[]{0}, Double.NaN));
        assertThrows(IllegalArgumentException.class, () -> new PathResult(new int[]{0}, Double.POSITIVE_INFINITY));
    }

    @Test
    void comparesByPathContentNotArrayIdentity() {
        PathResult a = new PathResult(new int[]{0, 1, 2}, 2.0);
        PathResult b = new PathResult(new int[]{0, 1, 2}, 2.0);

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }
}
