# Ashnav

Ashnav finds routes through caller-defined graphs and finite voxel grids in Java.
It separates connectivity, path search and world-coordinate mapping so you can test each part independently.

This README describes **2.0.0-SNAPSHOT**, a development build. Publication of these coordinates is not claimed.
Build and release evidence is recorded in [VERIFICATION.md](VERIFICATION.md).

## When to use it

Use Ashnav for graph search or for projecting a small, finite grid into a navigation graph.
A node is a place with an integer ID; an edge is an allowed move to another node.
For example, a plugin can represent three corridor cells as nodes 0, 1 and 2 and connect adjacent cells.
A solver returns the node sequence and its cost. It does not schedule NPCs, steer characters, render a map
or simulate collisions. Ashgrid owns voxel storage; Ashspace owns coordinate conversion.

> [!WARNING]
> A walkable cell alone does not establish Minecraft movement rules: support beneath a character,
> headroom, body clearance, stairs, doors, ladders, safe jumps/drops and crowd behavior are supplied by the caller.
> Grid projection checks only the two endpoint cells. In a 2-by-2 horizontal square with only opposite
> corners walkable, N18/N26 connect those corners even when both side cells are blocked. N6 does not.

For movement restrictions, implement `WeightedIntGraph` with only permitted edges and their costs.
A wrapper around a grid graph can filter each `(from,to)` pair in `forEachNeighbor` and delegate the cost
of accepted edges. The movement policy and any world data it reads must remain unchanged during a query.
Ashnav cannot infer a character's physical ability from the graph.

## Requirements and quick start

Use JDK 21 or newer and Maven 3.9.9 (the verified version). Production dependencies are Ashcore 1.0.1,
Ashgrid 1.2.0 and Ashspace 1.0.0; JUnit is test-scoped. These explicit release dependencies are retained
for compatibility. Newer sibling snapshots are a separate integration configuration, not silently selected.

Build this checkout with `mvn -B clean verify`. To use the development build in another local project,
run `mvn -B install` after verification and select its coordinates:

```xml
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashnav</artifactId>
  <version>2.0.0-SNAPSHOT</version>
</dependency>
```

Save the following as `AshnavQuickStart.java` in a consumer project using that dependency.
The build extracts this exact example, compiles it against the packaged JARs and runs it.
Dijkstra is used because it minimizes supplied traversal costs, including diagonal costs if the
neighborhood later changes.

```java
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

public final class AshnavQuickStart {
    public static void main(String[] args) {
        IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
        for (int x = 0; x < 3; x++) {
            grid.set(x, 0, 0, 1); // 1 = accepted by our walkability rule
        }

        GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(
                grid, value -> value == 1, GridNeighborhood3.N6
        );
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                2.0, new Vector3(-4.0, 8.0, 16.0), new SquareXZChunkScheme(16)
        );
        SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph, mapper);
        PathSearchResult result = navigator.findPath(
                new DijkstraPathfinder(graph),
                new Vector3(-3.0, 9.0, 17.0),
                new Vector3(1.0, 9.0, 17.0)
        );
        if (result.status() != PathStatus.FOUND) {
            throw new IllegalStateException("Expected an open corridor");
        }
        if (result.path().length() != 3 || result.path().totalCost() != 2.0) {
            throw new IllegalStateException("Unexpected corridor route");
        }
        System.out.println("nodes=" + result.path().length() + ", cost=" + result.path().totalCost());
    }
}
```

The route has three nodes and two cell-unit steps. Although each cell is two world units wide,
the returned cost is 2, not 4: world mapping does not rescale graph costs.

## Choosing a solver

| Solver | Objective and totalCost | Assumptions |
| --- | --- | --- |
| `BfsPathfinder` | Fewest edges; totalCost is the edge count | Ignores weights even on a weighted graph |
| `DijkstraPathfinder` | Lowest sum of supplied costs | Finite non-negative edge costs |
| `AStarPathfinder` | Lowest sum of supplied costs when the heuristic is admissible | Dijkstra's cost rules, plus a stable lower-bound heuristic and h(goal)=0 |

If S has a direct edge to G costing 10, and S to A to G costs 1+1, BFS returns S to G with
`totalCost=1`. Dijkstra returns S to A to G with `totalCost=2`. Neither cost is automatically a distance
in meters; its unit follows the solver and the graph supplied by the caller.

A heuristic estimates how much cost remains. Admissible means it never exceeds the cheapest remaining
cost. Use `(node, goal) -> 0.0` if you do not have a proven lower bound. A* checks finite, non-negative
estimates and checks that `h(goal)=0`, but cannot locally establish the global lower-bound property.
An overestimate can give a more expensive result: with the graph above and h(A)=100, A* returns cost 10.

Consistency is the stronger condition `h(u) <= edgeCost(u,v) + h(v)` for every edge. Ashnav A* supports
admissible heuristics that do not satisfy it: it reopens a processed node after a strictly cheaper route.
For S to A=3, S to B=1, B to A=1, A to G=2 and h(B)=3 (other estimates zero), it returns cost 4.
Reopening can require substantially more work than Dijkstra. The [CS188 search notes](https://inst.eecs.berkeley.edu/~cs188/fa22/assets/notes/cs188-fa22-note02.pdf)
explain the distinction between admissibility and consistency.

## Grid snapshots and world mapping

`GridWalkabilityGraph3` evaluates each cell once during construction and retains an immutable mapping.
The source grid, dimensions and walkability predicate must stay stable during construction. Afterwards,
editing the grid or changing predicate state does not update the graph. Rebuild the graph and its solver
and navigator to refresh it. Rebuilding can change node IDs; an old result still contains the old IDs.
A found route remains a statement about the queried graph state, not future world conditions.

Dimensions must be positive and their product must fit `int`. Both projection and `IntArrayGrid3i`
reject oversized products before allocation, including products that would overflow `long`.
This is an index limit, not a promise that a JVM can allocate that many cells. An all-blocked grid
creates a valid graph with zero nodes. Querying node 0 on it is invalid.

Node IDs are assigned with x changing fastest, then y, then z. N6 connects faces, N18 also connects
edge diagonals, and N26 also connects corner diagonals. Costs are 1, sqrt(2) and sqrt(3) cell units.
`nodeOfCell` returns -1 for blocked or outside cells; bounds are `[0,width) x [0,height) x [0,depth)`.
`cellOfNode` rejects invalid IDs. Offset arrays returned by `GridNeighborhood3.offsets()` are deep copies.

The world bridge uses Ashspace's right-handed coordinates with Y up. Lookup is
`floor((world-origin)/cellSize)` on each axis, with the dependency's double rounding and numeric limits.
There is no boundary epsilon: at zero origin and unit size, -0.2 maps to cell -1. Points must be finite
and mapped indices must fit int. Large translations or tiny cell sizes can lose cell detail.
`worldCenterOfNode` returns the mapped cell center; precision does not guarantee a round trip at extremes.
Local-frame points must first be converted to the mapper's world frame using Ashspace.

Built-in solvers implement `GraphPathfinder`. The navigator rejects a solver whose `graph()` is not
its own graph instance, even if both graphs have the same number of nodes. Custom `Pathfinder` lambdas
remain supported: the caller must ensure the same graph connectivity and node-ID mapping because
the bridge cannot inspect their identity. Custom solvers can implement `GraphPathfinder` to expose it.

A blocked or outside endpoint produces `UNREACHABLE` with `visitedNodeCount=0`, without calling the solver.
Check `nodeOfWorldPoint` to distinguish that case from disconnected valid endpoints. Invalid IDs throw
`IllegalArgumentException`; null inputs throw `NullPointerException`. Invalid emitted neighbors or evaluated
costs/estimates throw `IllegalStateException`. Numeric world mapping errors follow Ashspace's exceptions.
There is no search limit or interrupted-search status. `visitedNodeCount` counts distinct processed nodes,
including a found goal; an A* node reopened several times counts once.

## Ordering, ownership and numeric limits

Inputs include neighbor order, graph state, costs, heuristic/predicate behavior and dependency versions.
Repeatability is promised for the same inputs and versions in the same runtime environment. Cross-platform
bitwise floating-point equality and unchanged results across library releases are not promised.
Do not mutate graph/callback state during a query. Built-in solvers keep query state local; concurrent
queries require safely shared graph data and thread-safe callbacks. Mutable grids require synchronization.

| Operation | Observable ordering |
| --- | --- |
| Adjacency iteration | Supplied row order, including duplicates |
| Grid iteration | Offset order copied from the selected Ashgrid version at enum initialization |
| BFS | First discovery in neighbor iteration order |
| Dijkstra | Queue: distance, node ID, insertion sequence; equal-cost parent changes prefer smaller IDs before settling |
| A* | Queue: f=g+h, g, node ID, insertion sequence; equal-cost candidates retain the first parent |

These rules do not promise the lexicographically smallest entire route. Changing input order can change
BFS routes. Changing the heuristic can change A* ties. Do not mutate Ashgrid's public neighborhood arrays
before Ashnav enum initialization if you rely on their standard values.

`WeightedIntGraph` identifies an edge by `(from,to)`, so repeated neighbor emissions refer to one cost.
`WeightedAdjacencyIntGraph` preserves its historical first-entry rule: neighbors `[1,1]` with costs `[10,1]`
have cost 10, and reversing the costs gives 1. These are not independently selectable parallel edges.
Merge duplicate costs by minimum before construction if that is your intended model. Every supplied
cost must still be finite and non-negative, including later duplicate entries. Zero costs and self-loops
are supported. Adjacency constructors copy all rows; `PathResult` copies node arrays on input and output.

Weighted sums and A* priorities use rounded `double` arithmetic, with no tolerance. A non-finite evaluated
sum throws `IllegalStateException`, even if another route might be representable. Invalid callbacks are
checked only when evaluated; successful search is not a validation pass over the whole graph.
The usual optimality argument assumes exact arithmetic. With inexact sums, close real-number costs or
heuristic bounds can be affected by rounding; no real-number error bound or near-tie guarantee is claimed.
Use exactly representable bounded integer costs where exact comparisons are required.

## Operation costs

Let V be the node count, E the total number of neighbor entries (including duplicates), d(v) the length
of node v's row, L the returned path length and N=W*H*D the grid volume. For a particular weighted query,
P counts all queued states, including stale entries. A counts neighbor emissions across expansions,
including repeat A* expansions. X(v) counts expansions of v that emit neighbors. H is the total cost
of heuristic calls. Assume O(1) node checks and O(d(v)) neighbor iteration, excluding consumer work.

| Operation | Time | Additional memory, including result |
| --- | --- | --- |
| Adjacency graph construction | O(V+E) | O(V+E) |
| Weighted row edgeCost / neighbor iteration | O(d(v)) / O(d(v)) plus consumer time | O(1), excluding consumer |
| Grid snapshot construction | O(N), assuming O(1) predicate and grid reads | O(N) |
| BFS | O(V+E) | O(V), including an O(L) path |
| Dijkstra, O(1) edgeCost | O(V+E+P log(1+P)), P <= E+1 | O(V+P) |
| Dijkstra, weighted adjacency rows | Above plus O(sum(d(v)^2)) | O(V+P) |
| A*, O(1) edgeCost | O(V+A+P log(1+P)+H), P <= A+1 | O(V+P) |
| A*, weighted adjacency rows | Above plus O(sum(X(v)*d(v)^2)) | O(V+P) |
| Grid node/cell lookup, edgeCost, neighbor iteration | O(1), at most 26 offsets, plus consumer time | O(1) |
| World/node bridge lookup | O(1), excluding path search | O(1), with small coordinate allocations |
| PathResult construction / nodes() | O(L) | O(L) per copy |

With consistent estimates in exact arithmetic, each A* node is expanded at most once. With inconsistent
estimates, A and P are not bounded by a single pass over E; the number of improvements can be exponential.
The priority queue stores new states instead of decreasing a single entry per node, so memory is not
just O(V). For weighted adjacency rows, reading the cost of each of d neighbors scans that row repeatedly:
a hub with 10,000 distinct outgoing edges can require about 50 million comparisons during one expansion.
A dense graph can incur cubic total lookup work. Grid graphs have at most 26 neighbors and avoid that growth.
No lookup optimization or performance benchmark claim is made here.

Doubling all three grid dimensions multiplies snapshot storage and construction work by eight. Big-O is
not a latency or heap budget; projection allocates cell mappings and node coordinate objects.

## Supported API and migration

All public types and members under `nsk.nu.ashnav.api` and the public graph, grid and pathfinder classes
under `nsk.nu.ashnav.implementation` are supported API, including their existing constructors.
Package-private helpers and private nested queue records are internal. `IntArrayGrid3i` remains supported
as a compatibility helper with its original constructors and positive-dimension policy. For new storage
code, Ashgrid's `implementation.raster.arrays.ArrayGrid3i` supplies the same bounded read/write interface;
Ashnav does not expand into general storage ownership. No type is moved or deprecated in this correction.

The development version is 2.0.0-SNAPSHOT because corrected A* ties and stricter validation can change
observable behavior. Existing method/constructor signatures and `Pathfinder`'s functional shape remain.
A* now reopens cheaper routes, retains the first equal-cost parent, requires h(goal)=0 and may return
better routes for inconsistent heuristics. Rejecting mismatched built-in solvers and invalid grid dimensions
can turn previously misleading results into exceptions. Duplicate-edge first-cost semantics are unchanged.
Choose Dijkstra or zero estimates when migrating an unproven heuristic; reconstruct solvers with the
same graph as the navigator. Revalidate any golden route sequences rather than assuming ties survive an upgrade.
No serialized wire format is defined. Releases follow Semantic Versioning; existing artifacts must not be overwritten.

## Glossary

- **Graph:** Places (nodes) and permitted directed moves (edges).
- **Cost:** The common unit you minimize, such as travel time or cell steps; BFS always counts edges.
- **Heuristic:** A remaining-cost estimate used to prioritize A* work.
- **Snapshot:** A fixed mapping captured from grid state at construction time.
- **Walkability:** Your acceptance rule for an endpoint cell, separate from movement clearance.
- **Settled/closed node:** A node already processed; Dijkstra keeps it settled, while A* may reopen it.
- **Unreachable:** No route in the query model, or a missing endpoint in the world bridge.

## License

Apache License 2.0. See [LICENSE](LICENSE).
