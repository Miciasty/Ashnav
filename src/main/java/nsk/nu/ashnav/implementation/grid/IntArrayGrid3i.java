package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashgrid.api.raster.BoundedGrid3i;

/**
 * Dense finite integer grid backed by a flat int array.
 */
public final class IntArrayGrid3i implements BoundedGrid3i {
    private final int width;
    private final int height;
    private final int depth;
    private final int[] data;

    public IntArrayGrid3i(int width, int height, int depth) {
        if (width <= 0 || height <= 0 || depth <= 0) {
            throw new IllegalArgumentException("grid dimensions must be > 0");
        }
        long volume = (long) width * (long) height * (long) depth;
        if (volume > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("grid volume exceeds int capacity");
        }
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.data = new int[(int) volume];
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
