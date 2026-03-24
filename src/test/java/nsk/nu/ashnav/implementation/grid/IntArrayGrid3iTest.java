package nsk.nu.ashnav.implementation.grid;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class IntArrayGrid3iTest {

    @Test
    void readsAndWritesCellValues() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 2, 2);
        grid.set(1, 1, 1, 7);

        assertEquals(7, grid.get(1, 1, 1));
    }

    @Test
    void rejectsOutOfBoundsAccess() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 2, 2);

        assertThrows(IndexOutOfBoundsException.class, () -> grid.get(2, 0, 0));
        assertThrows(IndexOutOfBoundsException.class, () -> grid.set(-1, 0, 0, 1));
    }
}
