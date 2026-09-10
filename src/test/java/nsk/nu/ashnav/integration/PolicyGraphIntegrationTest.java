package nsk.nu.ashnav.integration;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.grid.GridNodeMapping3;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.AdjacencyIntGraph;
import nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashnav.implementation.path.BfsPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

final class PolicyGraphIntegrationTest {

    @Test
    void costsAndConnectivityComposeWithTheOriginalMapping() {
        GridWalkabilityGraph3 base = new GridWalkabilityGraph3(new IntArrayGrid3i(2, 1, 2), value -> true, GridNeighborhood3.N6);
        PolicyWeightedIntGraph policy = new PolicyWeightedIntGraph(base,
                (from, to) -> base.cellOfNode(to).x() >= base.cellOfNode(from).x(),
                (from, to, original) -> to == 1 ? 10.0 : original);
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(policy, base, mapper());
        var result = navigator.findPath(new DijkstraPathfinder(policy), new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 0.5, 1.5));
        assertArrayEquals(new int[]{0, 2, 3}, result.path().nodes());
        assertEquals(2.0, result.path().totalCost());
        assertEquals(PathStatus.UNREACHABLE, new DijkstraPathfinder(policy).findPath(3, 0).status());
        assertThrows(IllegalArgumentException.class, () -> policy.edgeCost(1, 0));
        assertThrows(IllegalArgumentException.class, () -> navigator.findPath(new DijkstraPathfinder(base),
                new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 0.5, 1.5)));
    }

    @Test
    void callerPolicyCanBlockCornerCutting() {
        IntArrayGrid3i grid = new IntArrayGrid3i(2, 1, 2);
        grid.set(0, 0, 0, 1);
        grid.set(1, 0, 1, 1);
        GridWalkabilityGraph3 base = new GridWalkabilityGraph3(grid, value -> value == 1, GridNeighborhood3.N26);
        PolicyWeightedIntGraph policy = new PolicyWeightedIntGraph(base, (from, to) -> {
            CellIndex3 a = base.cellOfNode(from);
            CellIndex3 b = base.cellOfNode(to);
            return base.nodeOfCell(a.x(), a.y(), b.z()) >= 0 && base.nodeOfCell(b.x(), a.y(), a.z()) >= 0;
        }, (from, to, original) -> original);
        assertEquals(PathStatus.FOUND, new DijkstraPathfinder(base).findPath(0, 1).status());
        assertEquals(PathStatus.UNREACHABLE, new DijkstraPathfinder(policy).findPath(0, 1).status());
    }

    @Test
    void mappingCanExistWithoutBeingAGraph() {
        GridNodeMapping3 nodes = new GridNodeMapping3() {
            @Override public int nodeCount() { return 2; }
            @Override public int nodeOfCell(int x, int y, int z) {
                return y == 0 && z == 0 && x >= 0 && x < 2 ? x : -1;
            }
            @Override public CellIndex3 cellOfNode(int nodeId) {
                if (nodeId < 0 || nodeId >= 2) throw new IllegalArgumentException("nodeId");
                return new CellIndex3(nodeId, 0, 0);
            }
        };
        AdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][]{{1}, {}});
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph, nodes, mapper());
        assertEquals(1, navigator.nodeOfWorldPoint(new Vector3(1.5, 0.5, 0.5)));
        assertEquals(new Vector3(0.5, 0.5, 0.5), navigator.worldCenterOfNode(0));
        assertEquals(PathStatus.FOUND, navigator.findPath(new BfsPathfinder(graph),
                new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 0.5, 0.5)).status());
        assertThrows(IllegalArgumentException.class, () -> new SpaceMappedGridNavigator3(
                new AdjacencyIntGraph(new int[][]{{}}), nodes, mapper()));
        assertThrows(NullPointerException.class, () -> new SpaceMappedGridNavigator3(graph, null, mapper()));
    }

    @Test
    void bfsAndRejectedEdgesDoNotEvaluateCostPolicy() {
        GridWalkabilityGraph3 base = new GridWalkabilityGraph3(new IntArrayGrid3i(2, 1, 1), value -> true, GridNeighborhood3.N6);
        PolicyWeightedIntGraph bfsPolicy = new PolicyWeightedIntGraph(base, (from, to) -> true,
                (from, to, original) -> { throw new AssertionError("BFS evaluated costs"); });
        assertEquals(1.0, new BfsPathfinder(bfsPolicy).findPath(0, 1).path().totalCost());
        PolicyWeightedIntGraph blocked = new PolicyWeightedIntGraph(base, (from, to) -> false,
                (from, to, original) -> { throw new AssertionError("rejected edge cost"); });
        assertEquals(PathStatus.UNREACHABLE, new DijkstraPathfinder(blocked).findPath(0, 1).status());
        for (double invalid : new double[]{-1.0, Double.NaN, Double.POSITIVE_INFINITY}) {
            PolicyWeightedIntGraph bad = new PolicyWeightedIntGraph(base, (from, to) -> true, (from, to, original) -> invalid);
            assertThrows(IllegalStateException.class, () -> bad.edgeCost(0, 1));
            assertThrows(IllegalStateException.class, () -> new DijkstraPathfinder(bad).findPath(0, 1));
        }
    }

    private static GridSpaceMapper3 mapper() {
        return new GridSpaceMapper3(1.0, Vector3.ZERO, new SquareXZChunkScheme(16));
    }
}
