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
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.api.path.Pathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class SpaceMappedGridNavigator3IntegrationTest {

    @Test
    void rejectsBuiltInSolversBoundToAnotherGraphWithTheSameNodeCount() {
        IntArrayGrid3i grid = new IntArrayGrid3i(4, 1, 1);
        grid.set(0, 0, 0, 1);
        grid.set(1, 0, 0, 1);
        grid.set(2, 0, 0, 1);
        GridWalkabilityGraph3 connected = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        grid.set(1, 0, 0, 0);
        grid.set(3, 0, 0, 1);
        GridWalkabilityGraph3 disconnected = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        assertEquals(connected.nodeCount(), disconnected.nodeCount());
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(connected,
                new GridSpaceMapper3(1.0, Vector3.ZERO, new SquareXZChunkScheme(16)));
        for (Pathfinder solver : new Pathfinder[]{new BfsPathfinder(disconnected), new DijkstraPathfinder(disconnected),
                new AStarPathfinder(disconnected, (node, goal) -> 0.0)}) {
            assertThrows(IllegalArgumentException.class, () -> navigator.findPath(solver,
                    new Vector3(0.5, 0.5, 0.5), new Vector3(2.5, 0.5, 0.5)));
        }
        BfsPathfinder bound = new BfsPathfinder(connected);
        Pathfinder compatibleLambda = bound::findPath;
        assertEquals(PathStatus.FOUND, navigator.findPath(compatibleLambda,
                new Vector3(0.5, 0.5, 0.5), new Vector3(2.5, 0.5, 0.5)).status());
    }

    @Test
    void mapsTranslatedScaledBoundariesAndDistinguishesMissingEndpoints() {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
        grid.set(0, 0, 0, 1);
        grid.set(2, 0, 0, 1);
        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph,
                new GridSpaceMapper3(2.0, new Vector3(-4.0, 8.0, 16.0), new SquareXZChunkScheme(16)));
        assertEquals(0, navigator.nodeOfWorldPoint(new Vector3(-4.0, 8.0, 16.0)));
        assertEquals(-1, navigator.nodeOfWorldPoint(new Vector3(Math.nextDown(-4.0), 8.0, 16.0)));
        assertEquals(0, navigator.nodeOfWorldPoint(new Vector3(Math.nextDown(-2.0), 8.0, 16.0)));
        assertEquals(-1, navigator.nodeOfWorldPoint(new Vector3(-2.0, 8.0, 16.0)));
        assertEquals(-1, navigator.nodeOfWorldPoint(new Vector3(2.0, 8.0, 16.0)));
        assertEquals(new Vector3(-3.0, 9.0, 17.0), navigator.worldCenterOfNode(0));
        PathSearchResult disconnected = navigator.findPath(new DijkstraPathfinder(graph),
                new Vector3(-3.0, 9.0, 17.0), new Vector3(1.0, 9.0, 17.0));
        assertEquals(PathSearchResult.unreachable(1), disconnected);
        assertEquals(PathSearchResult.unreachable(0), navigator.findPath((start, goal) -> {
            throw new AssertionError("missing endpoints must not invoke solver");
        }, new Vector3(-1.0, 9.0, 17.0), new Vector3(1.0, 9.0, 17.0)));
        assertThrows(NullPointerException.class, () -> navigator.nodeOfWorldPoint(null));
        assertThrows(IllegalArgumentException.class, () -> navigator.nodeOfWorldPoint(new Vector3(Double.NaN, 0.0, 0.0)));
    }

    @Test
    void worldCellSizeDoesNotRescaleGraphCost() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 1, 1);
        grid.set(0, 0, 0, 1);
        grid.set(1, 0, 0, 1);
        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N6);
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph,
                new GridSpaceMapper3(2.0, Vector3.ZERO, new SquareXZChunkScheme(16)));
        assertEquals(1.0, navigator.findPath(new DijkstraPathfinder(graph),
                new Vector3(1.0, 1.0, 1.0), new Vector3(3.0, 1.0, 1.0)).path().totalCost());
    }

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
