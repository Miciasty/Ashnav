window.WIKI_TOWER_JAVA = `import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;

public final class TowerRouteExample {
    static final int SIZE = 16, HEIGHT = 9;
    static final int[][] CRATES = {
        {10,10}, {11,10}, {12,10}, {10,9}, {7,12}, {7,13}, {7,14},
        {12,5}, {13,5}, {13,6}, {2,8}, {2,9}, {2,10}
    };

    public record Snapshot(GridWalkabilityGraph3 nodes,
                           PolicyWeightedIntGraph graph, int start, int goal) {}

    public static Snapshot capture(String barrier, int maxStep) {
        if (maxStep < 0 || maxStep > 1) throw new IllegalArgumentException("maxStep");
        int[][] terrain = new int[SIZE][SIZE];
        for (int x = 0; x < SIZE; x++) {
            for (int z = 0; z < SIZE; z++) terrain[x][z] = 1;
        }
        for (int x = 3; x <= 6; x++) {
            for (int z = 3; z <= 6; z++) terrain[x][z] = 6;
        }
        for (int step = 0; step < 4; step++) {
            for (int lane = 4; lane <= 5; lane++) {
                terrain[lane][7 + step] = 5 - step;
                terrain[7 + step][lane] = 5 - step;
            }
        }
        int[][] gate = switch (barrier) {
            case "south" -> new int[][] {{4,10}, {5,10}};
            case "east" -> new int[][] {{10,4}, {10,5}};
            case "parked" -> new int[][] {{13,7}, {13,8}};
            default -> throw new IllegalArgumentException("barrier");
        };
        int[][] solids = new int[SIZE][SIZE];
        for (int x = 0; x < SIZE; x++) solids[x] = terrain[x].clone();
        for (int[] p : CRATES) solids[p[0]][p[1]] += 3;
        for (int[] p : gate) solids[p[0]][p[1]] += 3;

        // Application rule: supported foot cell + two clear cells above terrain.
        // Obstacle roofs are not candidate surfaces in this example.
        IntArrayGrid3i candidates = new IntArrayGrid3i(SIZE, HEIGHT, SIZE);
        for (int x = 0; x < SIZE; x++) {
            for (int z = 0; z < SIZE; z++) {
                int y = terrain[x][z];
                if (solid(solids, x, y - 1, z)
                        && !solid(solids, x, y, z)
                        && !solid(solids, x, y + 1, z)) {
                    candidates.set(x, y, z, 1);
                }
            }
        }
        GridWalkabilityGraph3 nodes = new GridWalkabilityGraph3(
                candidates, value -> value == 1, GridNeighborhood3.N18);
        PolicyWeightedIntGraph graph = new PolicyWeightedIntGraph(nodes,
                (from, to) -> {
                    var a = nodes.cellOfNode(from);
                    var b = nodes.cellOfNode(to);
                    return Math.abs(a.x() - b.x()) + Math.abs(a.z() - b.z()) == 1
                            && Math.abs(a.y() - b.y()) <= maxStep;
                },
                (from, to, baseCost) -> baseCost);
        return new Snapshot(nodes, graph,
                nodes.nodeOfCell(12, 1, 13), nodes.nodeOfCell(4, 6, 4));
    }

    static boolean solid(int[][] heights, int x, int y, int z) {
        return x >= 0 && x < SIZE && z >= 0 && z < SIZE
                && y >= 0 && y < heights[x][z];
    }

    static AStarPathfinder solver(Snapshot snapshot) {
        return new AStarPathfinder(snapshot.graph(), (node, goal) -> {
            var a = snapshot.nodes().cellOfNode(node);
            var b = snapshot.nodes().cellOfNode(goal);
            double dx = a.x() - b.x(), dy = a.y() - b.y(), dz = a.z() - b.z();
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        });
    }

    public static void main(String[] args) {
        for (String barrier : new String[] {"south", "east", "parked"}) {
            // The caller captures a new stable model after moving the barrier.
            Snapshot current = capture(barrier, 1);
            var result = solver(current).findPath(current.start(), current.goal());
            if (result.status() != PathStatus.FOUND) throw new AssertionError(barrier);
            System.out.println(barrier + ": cost=" + result.path().totalCost());
            for (int id : result.path().nodes()) {
                var p = current.nodes().cellOfNode(id);
                System.out.print("(" + p.x() + "," + p.y() + "," + p.z() + ") ");
            }
            System.out.println();
        }
        Snapshot flatOnly = capture("parked", 0);
        if (solver(flatOnly).findPath(flatOnly.start(), flatOnly.goal()).status()
                != PathStatus.UNREACHABLE) throw new AssertionError("Tower needs steps");
    }
}`;
