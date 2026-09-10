package nsk.nu.ashnav.implementation.path;

import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.PathSearchState;
import nsk.nu.ashnav.api.path.ResumablePathfinder;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import org.junit.jupiter.api.Test;

import java.util.function.IntConsumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class PathSearchSessionTest {

    @Test
    void pausedSearchMatchesFullSearchForEverySolver() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{1, 2}, {3}, {1}, {}}, new double[][]{{3.0, 1.0}, {2.0}, {1.0}, {}}
        );
        for (ResumablePathfinder solver : solvers(graph)) {
            for (int budget : new int[]{1, 2, 100}) {
                PathSearchSession session = solver.startSearch(0, 3);
                assertEquals(PathSearchState.IN_PROGRESS, session.state());
                assertEquals(PathSearchState.IN_PROGRESS, session.advance(0));
                assertEquals(0, session.queuePopCount());
                assertThrows(IllegalStateException.class, session::result);
                while (session.state() == PathSearchState.IN_PROGRESS) {
                    long before = session.queuePopCount();
                    session.advance(budget);
                    assertTrue(session.queuePopCount() - before <= budget);
                }
                assertEquals(solver.findPath(0, 3), session.result());
                long finishedCount = session.queuePopCount();
                session.cancel();
                assertEquals(PathSearchState.FOUND, session.advance(20));
                assertEquals(finishedCount, session.queuePopCount());
                assertThrows(IllegalArgumentException.class, () -> session.advance(-1));
            }
        }
        PathSearchSession reopened = new AStarPathfinder(graph, (node, goal) -> node == 2 ? 3.0 : 0.0).startSearch(0, 3);
        reopened.advance(100);
        assertEquals(5, reopened.expansionCount());
        assertEquals(4, reopened.result().visitedNodeCount());
    }

    @Test
    void staleEntriesConsumeBudgetAndDoNotCountAsExpansions() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][]{{1, 2}, {}, {1}, {}}, new double[][]{{10.0, 1.0}, {}, {1.0}, {}}
        );
        for (ResumablePathfinder solver : new ResumablePathfinder[]{new DijkstraPathfinder(graph),
                new AStarPathfinder(graph, (node, goal) -> 0.0)}) {
            PathSearchSession session = solver.startSearch(0, 3);
            assertEquals(PathSearchState.IN_PROGRESS, session.advance(3));
            assertEquals(3, session.expansionCount());
            assertThrows(IllegalStateException.class, session::result);
            assertEquals(PathSearchState.UNREACHABLE, session.advance(1));
            assertEquals(4, session.queuePopCount());
            assertEquals(3, session.expansionCount());
            assertEquals(3, session.result().visitedNodeCount());
        }
    }

    @Test
    void cancellationIsTerminalAndDoesNotMeanUnreachable() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1}, {}}, new double[][]{{1.0}, {}});
        for (ResumablePathfinder solver : solvers(graph)) {
            for (int workBeforeCancel : new int[]{0, 1}) {
                PathSearchSession session = solver.startSearch(0, 1);
                session.advance(workBeforeCancel);
                session.cancel();
                session.cancel();
                assertEquals(PathSearchState.CANCELLED, session.advance(100));
                assertEquals(workBeforeCancel, session.queuePopCount());
                assertThrows(IllegalStateException.class, session::result);
                assertEquals(PathSearchState.FOUND, solver.startSearch(0, 1).advance(100));
            }
        }
    }

    @Test
    void sessionsAreIndependentAndHandleTrivialAndInvalidQueries() {
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(new int[][]{{1}, {}}, new double[][]{{2.0}, {}});
        for (ResumablePathfinder solver : solvers(graph)) {
            PathSearchSession first = solver.startSearch(0, 1);
            PathSearchSession second = solver.startSearch(1, 1);
            first.advance(1);
            assertEquals(PathSearchState.FOUND, second.advance(1));
            assertEquals(0.0, second.result().path().totalCost());
            assertEquals(PathSearchState.FOUND, first.advance(1));
            assertEquals(solver.findPath(0, 1), first.result());
            assertThrows(IllegalArgumentException.class, () -> solver.startSearch(-1, 1));
            assertThrows(IllegalArgumentException.class, () -> solver.startSearch(0, 2));
        }
        WeightedAdjacencyIntGraph empty = new WeightedAdjacencyIntGraph(new int[0][], new double[0][]);
        for (ResumablePathfinder solver : solvers(empty)) {
            assertThrows(IllegalArgumentException.class, () -> solver.startSearch(0, 0));
        }
    }

    @Test
    void callbackFailurePoisonsSessionAndIsRethrown() {
        IllegalArgumentException failure = new IllegalArgumentException("callback failure");
        IntGraph graph = new IntGraph() {
            @Override public int nodeCount() { return 2; }
            @Override public void forEachNeighbor(int nodeId, IntConsumer consumer) {
                consumer.accept(1);
                throw failure;
            }
        };
        PathSearchSession session = new BfsPathfinder(graph).startSearch(0, 1);
        assertSame(failure, assertThrows(IllegalArgumentException.class, () -> session.advance(1)));
        assertEquals(PathSearchState.FAILED, session.advance(100));
        session.cancel();
        assertEquals(PathSearchState.FAILED, session.state());
        assertThrows(IllegalStateException.class, session::result);
    }

    @Test
    void reentrantAdvanceIsRejectedAndTheWholeRowIsOneStep() {
        PathSearchSession[] active = new PathSearchSession[1];
        int[] emitted = {0};
        IntGraph graph = new IntGraph() {
            @Override public int nodeCount() { return 101; }
            @Override public void forEachNeighbor(int nodeId, IntConsumer consumer) {
                assertThrows(IllegalStateException.class, () -> active[0].advance(1));
                assertThrows(IllegalStateException.class, () -> active[0].cancel());
                for (int i = 1; i <= 100; i++) {
                    consumer.accept(i);
                    emitted[0]++;
                }
            }
        };
        active[0] = new BfsPathfinder(graph).startSearch(0, 100);
        assertEquals(PathSearchState.IN_PROGRESS, active[0].advance(1));
        assertEquals(100, emitted[0]);
        assertEquals(1, active[0].queuePopCount());
    }

    private static ResumablePathfinder[] solvers(WeightedAdjacencyIntGraph graph) {
        return new ResumablePathfinder[]{new BfsPathfinder(graph), new DijkstraPathfinder(graph),
                new AStarPathfinder(graph, (node, goal) -> 0.0)};
    }
}
