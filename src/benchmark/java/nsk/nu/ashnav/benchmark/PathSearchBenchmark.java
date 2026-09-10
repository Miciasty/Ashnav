package nsk.nu.ashnav.benchmark;

import nsk.nu.ashnav.api.graph.WeightedIntGraph;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.Pathfinder;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;

import java.lang.management.ManagementFactory;
import java.util.Locale;

/**
 * Standalone comparison harness; excluded from production and the normal test lifecycle.
 * Uses the old public API so the same class file can run against the baseline and new JARs.
 * Graph construction is excluded. Includes query initialization, search and path copies.
 * This small warmed measurement is not JMH or a portable latency guarantee.
 */
public final class PathSearchBenchmark {
    private static volatile double sink;

    public static void main(String[] args) {
        String label = args.length == 0 ? "current" : args[0];
        measure(label, "hub4096", hub(4096), 4096, 1.0);
        measure(label, "chain512", chain(512), 511, 511.0);
        measure(label, "grid48x48", new GridWalkabilityGraph3(new IntArrayGrid3i(48, 1, 48),
                value -> true, GridNeighborhood3.N6), 48 * 48 - 1, 94.0);
    }

    private static void measure(String label, String fixture, WeightedIntGraph graph, int goal, double expected) {
        for (Pathfinder solver : new Pathfinder[]{new DijkstraPathfinder(graph), new AStarPathfinder(graph, (node, target) -> 0.0)}) {
            run(solver, goal, expected, 40);
            com.sun.management.ThreadMXBean allocation = (com.sun.management.ThreadMXBean) ManagementFactory.getThreadMXBean();
            if (!allocation.isThreadAllocatedMemoryEnabled()) allocation.setThreadAllocatedMemoryEnabled(true);
            long thread = Thread.currentThread().threadId();
            long beforeBytes = allocation.getThreadAllocatedBytes(thread);
            long before = System.nanoTime();
            run(solver, goal, expected, 100);
            long elapsed = System.nanoTime() - before;
            long bytes = allocation.getThreadAllocatedBytes(thread) - beforeBytes;
            System.out.printf(Locale.ROOT, "%s,%s,%s,100,%.3f,%.1f%n", label, fixture,
                    solver.getClass().getSimpleName(), elapsed / 100_000.0, bytes / 100.0);
        }
    }

    private static void run(Pathfinder solver, int goal, double expected, int queries) {
        for (int i = 0; i < queries; i++) {
            var result = solver.findPath(0, goal);
            if (result.path().totalCost() != expected) throw new AssertionError("unexpected cost");
            sink = result.path().totalCost();
        }
    }

    private static WeightedIntGraph hub(int degree) {
        int[][] neighbors = new int[degree + 1][];
        double[][] costs = new double[degree + 1][];
        neighbors[0] = new int[degree];
        costs[0] = new double[degree];
        for (int i = 1; i <= degree; i++) {
            neighbors[0][i - 1] = i;
            costs[0][i - 1] = 1.0;
            neighbors[i] = new int[0];
            costs[i] = new double[0];
        }
        return new WeightedAdjacencyIntGraph(neighbors, costs);
    }

    private static WeightedIntGraph chain(int size) {
        int[][] neighbors = new int[size][];
        double[][] costs = new double[size][];
        for (int i = 0; i < size; i++) {
            neighbors[i] = i + 1 == size ? new int[0] : new int[]{i + 1};
            costs[i] = i + 1 == size ? new double[0] : new double[]{1.0};
        }
        return new WeightedAdjacencyIntGraph(neighbors, costs);
    }
}
