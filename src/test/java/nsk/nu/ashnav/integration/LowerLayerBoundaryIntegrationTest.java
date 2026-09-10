package nsk.nu.ashnav.integration;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

final class LowerLayerBoundaryIntegrationTest {

    @Test
    void divisionUnderflowCannotTurnAnOutsidePointIntoAFoundPath() {
        var graph = new GridWalkabilityGraph3(new IntArrayGrid3i(1, 1, 1), value -> true, GridNeighborhood3.N6);
        var mapper = new GridSpaceMapper3(2, Vector3.ZERO, new SquareXZChunkScheme(16));
        var navigator = new SpaceMappedGridNavigator3(graph, mapper);
        var frames = FrameGraph3.worldRoot();
        var framed = new FrameMappedGridNavigator3(graph, mapper, frames, frames.root());
        var solver = new DijkstraPathfinder(graph);
        var inside = new Vector3(1, 1, 1);
        for (int axis = 0; axis < 3; axis++) {
            double[] values = {1, 1, 1};
            values[axis] = -Double.MIN_VALUE;
            var outside = new Vector3(values[0], values[1], values[2]);
            assertEquals(-1, navigator.nodeOfWorldPoint(outside));
            assertEquals(-1, framed.nodeOfWorldPoint(outside));
            assertEquals(PathSearchResult.unreachable(0), navigator.findPath(solver, outside, inside));
            assertEquals(PathSearchResult.unreachable(0), framed.findPath(solver, outside, inside));
        }
        assertEquals(0, navigator.nodeOfWorldPoint(Vector3.ZERO));
        assertEquals(0, framed.nodeOfWorldPoint(Vector3.ZERO));
    }
}
