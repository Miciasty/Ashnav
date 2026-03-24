package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.Pathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

/**
 * World-space bridge for pathfinding over a {@link GridWalkabilityGraph3}.
 */
public final class SpaceMappedGridNavigator3 {
    private final GridWalkabilityGraph3 graph;
    private final GridSpaceMapper3 mapper;

    public SpaceMappedGridNavigator3(GridWalkabilityGraph3 graph, GridSpaceMapper3 mapper) {
        if (graph == null) {
            throw new NullPointerException("graph");
        }
        if (mapper == null) {
            throw new NullPointerException("mapper");
        }
        this.graph = graph;
        this.mapper = mapper;
    }

    /**
     * Returns graph node ID for world-space point or {@code -1} when the mapped cell is not walkable.
     */
    public int nodeOfWorldPoint(Vector3 worldPoint) {
        CellIndex3 cell = mapper.worldToCell(worldPoint);
        return graph.nodeOfCell(cell.x(), cell.y(), cell.z());
    }

    /**
     * World-space center of graph node cell.
     */
    public Vector3 worldCenterOfNode(int nodeId) {
        return mapper.cellCenter(graph.cellOfNode(nodeId));
    }

    /**
     * Finds path between world-space points.
     */
    public PathSearchResult findPath(Pathfinder pathfinder, Vector3 startWorldPoint, Vector3 goalWorldPoint) {
        if (pathfinder == null) {
            throw new NullPointerException("pathfinder");
        }
        if (startWorldPoint == null) {
            throw new NullPointerException("startWorldPoint");
        }
        if (goalWorldPoint == null) {
            throw new NullPointerException("goalWorldPoint");
        }

        int startNodeId = nodeOfWorldPoint(startWorldPoint);
        int goalNodeId = nodeOfWorldPoint(goalWorldPoint);
        if (startNodeId < 0 || goalNodeId < 0) {
            return PathSearchResult.unreachable(0);
        }
        return pathfinder.findPath(startNodeId, goalNodeId);
    }
}
