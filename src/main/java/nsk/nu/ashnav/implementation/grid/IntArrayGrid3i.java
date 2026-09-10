package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashgrid.api.raster.BoundedGrid3i;

/**
 * Mutable, zero-filled finite integer grid backed by a private flat int array.
 * Dimensions must be positive and their product must fit int before allocation;
 * actual allocation is also limited by the JVM and available memory.
 * Coordinates are half-open on each axis; outside access throws IndexOutOfBoundsException.
 * Construction takes O(W*H*D) time/storage; cell access takes O(1).
 * Retained as a compatibility helper; general voxel storage belongs to Ashgrid.
 * Concurrent access with writes requires external synchronization.
 */
public final class IntArrayGrid3i implements BoundedGrid3i {
    private final int width;
    private final int height;
    private final int depth;
    private final int[] data;

    public IntArrayGrid3i(int width, int height, int depth) {
        int volume = GridDimensions.volume(width, height, depth);
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.data = new int[volume];
    }

    @Override
    public int get(int x, int y, int z) {
        return data[indexOf(x, y, z)];
    }

    @Override
    public void set(int x, int y, int z, int value) {
        data[indexOf(x, y, z)] = value;
    }

    @Override
    public boolean inside(int x, int y, int z) {
        return x >= 0 && x < width
                && y >= 0 && y < height
                && z >= 0 && z < depth;
    }

    @Override
    public int width() {
        return width;
    }

    @Override
    public int height() {
        return height;
    }

    @Override
    public int depth() {
        return depth;
    }

    private int indexOf(int x, int y, int z) {
        if (!inside(x, y, z)) {
            throw new IndexOutOfBoundsException("outside grid: (" + x + "," + y + "," + z + ")");
        }
        return (z * height + y) * width + x;
    }
}
