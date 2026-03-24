package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.raster.BoundedGrid3i;
import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.function.IntConsumer;
import java.util.function.IntPredicate;

/**
 * Deterministic graph projection over a finite voxel grid using walkability predicate.
 */
public final class GridWalkabilityGraph3 implements WeightedIntGraph {
    private final int width;
    private final int height;
    private final int depth;

    private final int[] cellToNode;
    private final CellIndex3[] nodeToCell;

    private final int[][] offsets;
    private final double[] offsetCosts;

    public GridWalkabilityGraph3(
            BoundedGrid3i grid,
            IntPredicate walkableValue,
            GridNeighborhood3 neighborhood
    ) {
        requireInputs(grid, walkableValue, neighborhood);

        this.width = grid.width();
        this.height = grid.height();
        this.depth = grid.depth();

        long volume = computeVolume(width, height, depth);
        requireVolumeFitsInt(volume);

        this.cellToNode = new int[(int) volume];
        Arrays.fill(cellToNode, -1);
        this.nodeToCell = buildNodeMapping(grid, walkableValue);

        this.offsets = neighborhood.offsets();
        this.offsetCosts = computeOffsetCosts(offsets);
    }

    @Override
    public int nodeCount() {
        return nodeToCell.length;
    }

    @Override
    public void forEachNeighbor(int nodeId, IntConsumer neighborConsumer) {
        if (neighborConsumer == null) {
            throw new NullPointerException("neighborConsumer");
        }
        if (!isValidNode(nodeId)) {
            throw new IllegalArgumentException("nodeId out of range: " + nodeId);
        }

        CellIndex3 cell = nodeToCell[nodeId];
        int x = cell.x();
        int y = cell.y();
        int z = cell.z();

        for (int i = 0; i < offsets.length; i++) {
            int nx = x + offsets[i][0];
            int ny = y + offsets[i][1];
            int nz = z + offsets[i][2];
            int neighborId = nodeOfCell(nx, ny, nz);
            if (neighborId < 0) continue;
            neighborConsumer.accept(neighborId);
        }
    }

    @Override
    public double edgeCost(int fromNodeId, int toNodeId) {
        if (!isValidNode(fromNodeId)) {
            throw new IllegalArgumentException("fromNodeId out of range: " + fromNodeId);
        }
        if (!isValidNode(toNodeId)) {
            throw new IllegalArgumentException("toNodeId out of range: " + toNodeId);
        }

        CellIndex3 from = nodeToCell[fromNodeId];
        CellIndex3 to = nodeToCell[toNodeId];
        int dx = to.x() - from.x();
        int dy = to.y() - from.y();
        int dz = to.z() - from.z();
        int offsetIndex = offsetIndex(dx, dy, dz);
        if (offsetIndex >= 0) return offsetCosts[offsetIndex];
        throw new IllegalArgumentException("No directed edge " + fromNodeId + " -> " + toNodeId);
    }

    public int nodeOfCell(int x, int y, int z) {
        if (!inside(x, y, z)) {
            return -1;
        }
        return cellToNode[cellIndex(x, y, z)];
    }

    public CellIndex3 cellOfNode(int nodeId) {
        if (!isValidNode(nodeId)) {
            throw new IllegalArgumentException("nodeId out of range: " + nodeId);
        }
        return nodeToCell[nodeId];
    }

    public boolean isWalkableCell(int x, int y, int z) {
        return nodeOfCell(x, y, z) >= 0;
    }

    private boolean inside(int x, int y, int z) {
        return x >= 0 && x < width
                && y >= 0 && y < height
                && z >= 0 && z < depth;
    }

    private int cellIndex(int x, int y, int z) {
        return (z * height + y) * width + x;
    }

    private int offsetIndex(int dx, int dy, int dz) {
        for (int i = 0; i < offsets.length; i++) {
            if (offsets[i][0] != dx) continue;
            if (offsets[i][1] != dy) continue;
            if (offsets[i][2] != dz) continue;
            return i;
        }
        return -1;
    }

    private static void requireInputs(BoundedGrid3i grid, IntPredicate walkableValue, GridNeighborhood3 neighborhood) {
        if (grid == null) throw new NullPointerException("grid");
        if (walkableValue == null) throw new NullPointerException("walkableValue");
        if (neighborhood == null) throw new NullPointerException("neighborhood");
    }

    private static long computeVolume(int width, int height, int depth) {
        return (long) width * (long) height * (long) depth;
    }

    private static void requireVolumeFitsInt(long volume) {
        if (volume <= Integer.MAX_VALUE) return;
        throw new IllegalArgumentException("grid volume exceeds int capacity: " + volume);
    }

    private CellIndex3[] buildNodeMapping(BoundedGrid3i grid, IntPredicate walkableValue) {
        ArrayList<CellIndex3> nodes = new ArrayList<>();
        for (int flatCellIndex = 0; flatCellIndex < cellToNode.length; flatCellIndex++) {
            CellIndex3 cell = cellFromFlatIndex(flatCellIndex);
            if (!walkableValue.test(grid.get(cell.x(), cell.y(), cell.z()))) continue;

            int nodeId = nodes.size();
            cellToNode[flatCellIndex] = nodeId;
            nodes.add(cell);
        }
        return nodes.toArray(new CellIndex3[0]);
    }

    private CellIndex3 cellFromFlatIndex(int flatCellIndex) {
        int x = flatCellIndex % width;
        int yz = flatCellIndex / width;
        int y = yz % height;
        int z = yz / height;
        return new CellIndex3(x, y, z);
    }

    private static double[] computeOffsetCosts(int[][] offsets) {
        double[] costs = new double[offsets.length];
        for (int i = 0; i < offsets.length; i++) {
            int dx = offsets[i][0];
            int dy = offsets[i][1];
            int dz = offsets[i][2];
            costs[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        return costs;
    }
}
