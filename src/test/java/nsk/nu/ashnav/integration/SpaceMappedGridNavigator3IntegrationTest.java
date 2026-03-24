package nsk.nu.ashnav.integration;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashnav.implementation.path.BfsPathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

final class SpaceMappedGridNavigator3IntegrationTest {

    @Test
    void mapsWorldCoordinatesToGridPathfindingDeterministically() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
        for (int x = 0; x < 3; x++) {
            grid.set(x, 0, 0, 1);
        }

        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph, mapper);

        BfsPathfinder pathfinder = new BfsPathfinder(graph);
        PathSearchResult result = navigator.findPath(
                pathfinder,
                new Vector3(0.1, 0.1, 0.1),
                new Vector3(2.1, 0.1, 0.1)
        );

        assertEquals(PathStatus.FOUND, result.status());
        assertEquals(3, result.path().length());

        int startNode = navigator.nodeOfWorldPoint(new Vector3(0.1, 0.1, 0.1));
        assertEquals(new Vector3(0.5, 0.5, 0.5), navigator.worldCenterOfNode(startNode));
    }
}
