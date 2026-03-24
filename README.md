# Ashnav

Low-level deterministic Java library for graph and voxel-grid pathfinding primitives.

> [!NOTE]
> Ashnav is the navigation layer of Blackframe.
> - Voxel storage/traversal primitives belong to Ashgrid.
> - World/local coordinate mapping belongs to Ashspace.
> - Gameplay behaviors (NPC scheduling, animation, decision logic) belong to higher layers.

## 1. Purpose
Ashnav provides deterministic shortest-path primitives for graph and voxel-grid navigation in Java.

## 2. Problem
Navigation code is difficult to test and debug when path selection changes between runs or mixes coordinate conversion with algorithm logic.
Ashnav separates graph contracts, deterministic solvers, and world/grid mapping so route behavior stays reproducible.

## 3. When to use
Use Ashnav when you need low-level deterministic pathfinding over explicit graph connectivity (including grid-projected graphs).
Do not use Ashnav as a gameplay AI framework, steering system, or renderer-integrated navigation stack.

## 4. Simple example (Minecraft plugin example)
A Minecraft plugin stores walkable cells in a voxel grid and needs repeatable patrol routes.
Ashnav can project walkable cells to a deterministic graph, map world positions to nodes with Ashspace, then solve routes with BFS, Dijkstra, or A*.

> [!WARNING]
> Ashnav does not infer Minecraft-specific movement semantics from blocks on its own
> (for example stairs, doors, ladders, jump/drop constraints, crowd steering).
> Those rules must be encoded into walkability and edge connectivity before path search.

## 5. How it works
1. Provide connectivity using `IntGraph` or `WeightedIntGraph`.
2. Optionally project a voxel grid with `GridWalkabilityGraph3` (`Ashgrid`).
3. Solve the route deterministically with `BfsPathfinder`, `DijkstraPathfinder`, or `AStarPathfinder`.
4. Optionally map world-space points with `SpaceMappedGridNavigator3` (`Ashspace`) and consume immutable `PathSearchResult`.

> [!CAUTION]
> Pathfinding is deterministic for the same graph and query inputs.
> If your world changes over time, rebuild or update graph data deterministically before querying paths.

## 6. Big-O for operations
| Operation | Time | Additional memory |
| --- | --- | --- |
| `new AdjacencyIntGraph(int[][])` | `O(V + E)` | `O(V + E)` |
| `new WeightedAdjacencyIntGraph(int[][], double[][])` | `O(V + E)` | `O(V + E)` |
| `new GridWalkabilityGraph3(grid, walkable, neighborhood)` | `O(W*H*D)` | `O(W*H*D)` |
| `BfsPathfinder.findPath(start, goal)` | `O(V + E)` | `O(V)` |
| `DijkstraPathfinder.findPath(start, goal)` | `O((V + E) log V)` | `O(V)` |
| `AStarPathfinder.findPath(start, goal)` | `O((V + E) log V)` worst-case | `O(V)` |
| `SpaceMappedGridNavigator3.nodeOfWorldPoint(world)` | `O(1)` | `O(1)` |
| `PathResult.nodes()` | `O(L)` | `O(L)` |

`V` = number of nodes, `E` = number of directed edges, `L` = path length, `W/H/D` = grid dimensions.

## 7. Core terms
- Node: Integer ID in range `[0, nodeCount)`.
- Edge cost: Finite non-negative traversal cost for directed edge `u -> v`.
- Deterministic tie-break: Equal-cost alternatives are resolved with a stable node-order rule.
- Walkable cell: Grid cell accepted by a walkability predicate and projected into graph node space.
- Path result: Immutable route (`PathResult`) wrapped in status-aware `PathSearchResult`.

## 8. Quick-start
Maven:

```xml
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashnav</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashnav.implementation.path.BfsPathfinder;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

IntArrayGrid3i grid = new IntArrayGrid3i(3, 1, 1);
for (int x = 0; x < 3; x++) {
    grid.set(x, 0, 0, 1); // 1 = walkable
}

GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(
        grid,
        value -> value == 1,
        GridNeighborhood3.N6
);
GridSpaceMapper3 mapper = new GridSpaceMapper3(1.0, Vector3.ZERO, new SquareXZChunkScheme(16));
SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(graph, mapper);

PathSearchResult result = navigator.findPath(
        new BfsPathfinder(graph),
        new Vector3(0.1, 0.1, 0.1),
        new Vector3(2.1, 0.1, 0.1)
);
System.out.println(result.path().nodes().length); // 3
```

## License
Apache License 2.0. See `LICENSE`.
