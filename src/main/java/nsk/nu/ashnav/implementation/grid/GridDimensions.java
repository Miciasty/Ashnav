package nsk.nu.ashnav.implementation.grid;

final class GridDimensions {
    private GridDimensions() {
    }

    static int volume(int width, int height, int depth) {
        if (width <= 0 || height <= 0 || depth <= 0) {
            throw new IllegalArgumentException("grid dimensions must be > 0");
        }
        long area = (long) width * height;
        if (area > Integer.MAX_VALUE / depth) {
            throw new IllegalArgumentException("grid volume exceeds int capacity");
        }
        return (int) (area * depth);
    }
}
