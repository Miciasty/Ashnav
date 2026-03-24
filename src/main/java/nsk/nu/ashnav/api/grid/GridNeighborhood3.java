package nsk.nu.ashnav.api.grid;

import nsk.nu.ashgrid.api.voxel.neighborhood.Neighborhood3D;

/**
 * Supported deterministic neighborhood sets for voxel-cell graph projection.
 */
public enum GridNeighborhood3 {
    N6(Neighborhood3D.N6),
    N18(Neighborhood3D.N18),
    N26(Neighborhood3D.N26);

    private final int[][] offsets;

    GridNeighborhood3(int[][] offsets) {
        this.offsets = copyOffsets(offsets);
    }

    /**
     * Returns neighbor offsets in deterministic iteration order.
     */
    public int[][] offsets() {
        return copyOffsets(offsets);
    }

    private static int[][] copyOffsets(int[][] source) {
        int[][] copy = new int[source.length][];
        for (int i = 0; i < source.length; i++) {
            copy[i] = source[i].clone();
        }
        return copy;
    }
}
