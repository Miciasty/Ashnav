package nsk.nu.ashnav.api.grid;

import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;

/**
 * Read-only cell/node mapping independent of traversal connectivity and costs.
 * Valid IDs are [0,nodeCount). Each mapped cell identifies one node and cellOfNode
 * must be its inverse. Mapping and node count must remain stable throughout use,
 * including between search steps. A matching count alone does not prove matching IDs.
 */
public interface GridNodeMapping3 {
    int nodeCount();

    /** Returns -1 for a cell without a node, including outside the mapped domain. */
    int nodeOfCell(int x, int y, int z);

    /** Returns the node's cell; rejects an invalid ID with IllegalArgumentException. */
    CellIndex3 cellOfNode(int nodeId);
}
