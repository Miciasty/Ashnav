(function () {
  'use strict';

  const { code, table, note, cards } = window.WIKI_DOCS;
  const c = value => `<code>${value}</code>`;
  const box = (label, detail) => `<div class="rounded-[6px] border border-line p-[14px]" style="flex:1 1 140px"><strong>${label}</strong><p>${detail}</p></div>`;
  const flow = (title, items, caption) => `<figure class="my-[22px] rounded-[7px] border border-line bg-surface p-[17px]" aria-label="${title}"><div style="display:flex;flex-wrap:wrap;gap:12px">${items.map(([label, detail]) => box(label, detail)).join('')}</div><figcaption>${caption}</figcaption></figure>`;

  window.WIKI_PAGES.push(
    {
      id: 'graph-model', category: 'Navigation model', title: 'Graphs and node IDs', kind: 'concept',
      description: 'Define directed connectivity, choose costs, and preserve the meaning of each integer node ID.',
      intro: '<p>A graph describes places and permitted moves. A node is a place with an integer ID. An outgoing edge permits movement from one node to another. Ashnav searches this model; your application decides what each place and move represents.</p>',
      sections: [
        { id: 'directed-connectivity', title: 'Represent permitted moves', html:
          '<p>Valid IDs fill <code>[0, nodeCount())</code>: zero is valid when the graph has nodes, and <code>nodeCount()</code> itself is outside the range. An edge from 0 to 1 does not create the reverse edge. Add both directions when movement is reversible.</p>' +
          '<div data-diagram="directed-graph"></div>' +
          code('import nsk.nu.ashnav.implementation.graph.AdjacencyIntGraph;\nimport nsk.nu.ashnav.implementation.path.BfsPathfinder;\n\nAdjacencyIntGraph graph = new AdjacencyIntGraph(new int[][] {\n    {1}, // Outgoing neighbors of node 0\n    {2}, // Outgoing neighbors of node 1\n    {}   // Outgoing neighbors of node 2\n});\nvar forward = new BfsPathfinder(graph).findPath(0, 2);\nvar reverse = new BfsPathfinder(graph).findPath(2, 0);', 'java', 'Directed graph · excerpt') +
          '<p><code>forward</code> contains <code>[0, 1, 2]</code> with cost 2. <code>reverse</code> has status <code>UNREACHABLE</code> and a null path. A zero-node adjacency graph is valid, but no start or goal ID is valid on it.</p>'
        },
        { id: 'graph-implementations', title: 'Choose a graph representation', html:
          table(['Type', 'Use it for', 'Ownership'], [
            [c('AdjacencyIntGraph'), 'A fixed graph with no cost data; BFS minimizes its edge count.', 'Copies each supplied adjacency row.'],
            [c('WeightedAdjacencyIntGraph'), 'A fixed graph with caller-defined costs.', 'Copies neighbor and cost rows; the row shapes must match.'],
            [c('GridWalkabilityGraph3'), 'A finite grid projected into accepted cells and neighborhood edges.', 'Captures a snapshot at construction. See <a href="#/grid-graphs">Grid graphs</a>.'],
            [c('PolicyWeightedIntGraph'), 'A view that removes directed edges or replaces costs.', 'Retains the base graph and callbacks. See <a href="#/policies">Movement policies</a>.'],
            [c('IntGraph') + ' / ' + c('WeightedIntGraph'), 'A custom representation or generated connectivity.', 'Your implementation must keep the query model stable.']
          ]) + '<p>All built-in adjacency constructors accept self-loops and duplicate neighbors. They preserve the supplied row order. Null matrices or rows throw <code>NullPointerException</code>; invalid neighbor IDs throw <code>IllegalArgumentException</code>.</p>'
        },
        { id: 'weighted-edges', title: 'Give every edge a common cost unit', html:
          '<p><code>WeightedIntGraph</code> adds a finite, non-negative cost for each directed edge. The unit belongs to your model: cell steps, travel time, or a common penalty scale. Dijkstra and A* sum these values. BFS ignores them and reports the number of edges.</p>' +
          '<p>Zero-cost edges and self-loops are supported. Negative costs, NaN, and infinity are invalid. Weighted adjacency constructors check every supplied value, including entries that repeat a neighbor.</p>' +
          code('import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;\n\nWeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(\n    new int[][]    {{1, 1}, {}},\n    new double[][] {{10, 1}, {}}\n);\ndouble cost = graph.edgeCost(0, 1); // 10.0\ngraph.forEachEdge(0, (neighbor, value) -> {\n    // Called twice with neighbor=1 and value=10.0.\n});', 'java', 'Duplicate costs · excerpt') +
          note('Repeated neighbors share one edge cost', '<p>An edge is identified by <code>(from, to)</code>. The first matching adjacency entry supplies its cost. The rows <code>[1, 1]</code> and <code>[10, 1]</code> describe two emissions of the same cost-10 edge. Merge entries by their minimum cost before construction if that is your intended model.</p>')
        },
        { id: 'custom-graph-contract', title: 'Implement a custom graph', html:
          '<p>Return a non-negative node count. Emit valid outgoing IDs synchronously, in the same order for unchanged graph state. Do not retain the consumer. Keep counts, connectivity, neighbor order, edge costs, and callback data stable throughout a complete search, including session pauses.</p>' +
          '<p>For a weighted graph, <code>forEachEdge</code> must emit the same neighbors as <code>forEachNeighbor</code>, paired with the corresponding <code>edgeCost</code> values. The default calls <code>edgeCost</code> once per emission. Override it when your storage can read neighbors and costs together.</p>' +
          '<p>If <code>edgeCost</code> scans an entire row, the default can turn one row expansion into quadratic lookup work. The built-in weighted adjacency and grid graphs override this method. Callback invocation counts are not a stable API; callbacks must not change future values through side effects.</p>' +
          cards([['api-reference', 'Graph API', 'Exact interfaces, constructors, and supported members.'], ['limits', 'Ordering and limits', 'Repeatability, operation costs, and numeric behavior.']])
        }
      ]
    },
    {
      id: 'solvers', category: 'Pathfinding', title: 'Choose a pathfinder', navTitle: 'Pathfinders', kind: 'concept',
      description: 'Compare BFS, Dijkstra, and A* by the cost they minimize and the assumptions they require.',
      intro: '<p>Choose the solver from the meaning of an edge. Use BFS for the fewest moves, Dijkstra for the lowest supplied cost, and A* when you have a proven lower bound on remaining cost.</p>',
      sections: [
        { id: 'solver-objective', title: 'Fewest edges or lowest cost', html:
          table(['Solver', 'Objective', 'Returned totalCost'], [
            [c('BfsPathfinder(IntGraph)'), 'Fewest directed edges. All weights are ignored.', 'Number of edges in the route.'],
            [c('DijkstraPathfinder(WeightedIntGraph)'), 'Lowest sum of finite, non-negative costs.', 'Rounded sum of supplied edge costs.'],
            [c('AStarPathfinder(WeightedIntGraph, IntHeuristic)'), 'Lowest sum when the heuristic is admissible and h(goal)=0.', 'Rounded sum of supplied edge costs.']
          ]) +
          '<p>Consider three nodes: S=0, A=1, and G=2. The direct edge S→G costs 10. The route S→A→G costs 1+1. BFS chooses one edge; Dijkstra chooses cost 2.</p>' +
          '<div data-diagram="solver-comparison"></div>' +
          code('import java.util.Arrays;\nimport nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;\nimport nsk.nu.ashnav.implementation.path.AStarPathfinder;\nimport nsk.nu.ashnav.implementation.path.BfsPathfinder;\nimport nsk.nu.ashnav.implementation.path.DijkstraPathfinder;\n\npublic final class WikiSolverComparison {\n    public static void main(String[] args) {\n        var graph = new WeightedAdjacencyIntGraph(\n            new int[][]    {{2, 1}, {2}, {}},\n            new double[][] {{10, 1}, {1}, {}}\n        );\n        var fewestMoves = new BfsPathfinder(graph).findPath(0, 2);\n        var lowestCost = new DijkstraPathfinder(graph).findPath(0, 2);\n        var zeroEstimate = new AStarPathfinder(graph, (node, goal) -> 0.0)\n            .findPath(0, 2);\n\n        if (fewestMoves.path().totalCost() != 1.0\n                || !Arrays.equals(fewestMoves.path().nodes(), new int[] {0, 2})\n                || lowestCost.path().totalCost() != 2.0\n                || !Arrays.equals(lowestCost.path().nodes(), new int[] {0, 1, 2})\n                || !zeroEstimate.path().equals(lowestCost.path())) {\n            throw new IllegalStateException("Unexpected solver result");\n        }\n        System.out.println("BFS cost=1.0, Dijkstra cost=2.0, A* cost=2.0");\n    }\n}', 'java', 'WikiSolverComparison.java') +
          '<p>The weighted results contain <code>[0, 1, 2]</code> with cost 2. BFS contains <code>[0, 2]</code> with cost 1. The same distinction matters for grid diagonals: N18 and N26 have different step costs.</p>'
        },
        { id: 'a-star-heuristic', title: 'Supply an admissible A* heuristic', html:
          '<p>A heuristic estimates the cost remaining from a node to the goal. <em>Admissible</em> means the estimate never exceeds the cheapest remaining cost. Estimates must use the same units as edges, stay stable, and be finite and non-negative. The goal estimate must equal zero.</p>' +
          '<p>A* checks numeric values when it evaluates them and checks <code>estimate(goal, goal)</code> at session creation. It cannot prove that your estimate is a lower bound. In the triangle above, setting <code>h(A)=100</code> and all other estimates to zero makes A* return the direct cost-10 route.</p>' +
          code('var safeDefault = new AStarPathfinder(graph, (node, goal) -> 0.0);\n\n// This is intentionally inadmissible for the cost-1 edge A → G.\nvar overestimate = new AStarPathfinder(\n    graph, (node, goal) -> node == 1 ? 100.0 : 0.0\n);\n// overestimate.findPath(0, 2).path().totalCost() is 10.0.', 'java', 'Heuristic choice · excerpt') +
          note('Start with zero if the lower bound is unproven', '<p>Zero estimates remove heuristic guidance and preserve a valid lower bound for non-negative costs. A* and Dijkstra can still choose different equal-cost routes because their parent tie rules differ. If a policy changes costs, recheck the heuristic against those changed costs.</p>')
        },
        { id: 'reopening', title: 'Understand reopening', html:
          '<p>A consistent heuristic satisfies <code>h(u) ≤ cost(u,v) + h(v)</code> for every edge. Ashnav A* also supports admissible heuristics that violate this condition. When it discovers a strictly cheaper route to a processed node, it reopens that node and can process it again.</p>' +
          flow('A* reopening example', [
            ['1. Process A', 'S→A costs 3. A is first processed with g(A)=3.'],
            ['2. Process B', 'S→B costs 1; h(B)=3. B later finds B→A at cost 1.'],
            ['3. Reopen A', 'The new g(A)=2 is strictly lower. A→G costs 2, so the result costs 4.']
          ], 'Example edges: S→A=3, S→B=1, B→A=1, A→G=2. Set h(B)=3 and every other estimate to zero. A is processed twice, but visitedNodeCount counts it once.') +
          '<p>Reopening can require much more work than a single traversal of the edges. Use <code>expansionCount()</code> to observe repeated processing and <code>queuePopCount()</code> to include stale queue entries. See <a href="#/sessions">Search sessions</a> for how these counters relate to the budget.</p>'
        },
        { id: 'equal-cost-routes', title: 'Read equal-cost results', html:
          '<p>BFS retains the first discovered parent in neighbor order. Dijkstra orders queued states by distance, node ID, then insertion sequence. Before a destination settles, an equal-distance parent candidate can replace its parent with a smaller node ID.</p>' +
          '<p>A* orders queued states by <code>f=g+h</code>, then <code>g</code>, node ID, and insertion sequence. It retains the first parent for equal-cost candidates. These rules do not promise the lexicographically smallest complete route.</p>' +
          '<p>Solvers use rounded <code>double</code> arithmetic without a comparison tolerance. Non-finite evaluated sums throw <code>IllegalStateException</code>. Very close mathematical costs and bounds can be affected by rounding; see <a href="#/limits">Ordering and limits</a>.</p>'
        }
      ]
    },
    {
      id: 'sessions', category: 'Pathfinding', title: 'Search sessions', kind: 'guide',
      description: 'Split a search into queue-pop budgets, observe its state, and cancel between steps.',
      intro: '<p>All three built-in pathfinders implement <code>ResumablePathfinder</code>. A session keeps one query’s state between calls. Your application decides when to advance it and when to cancel it.</p>',
      sections: [
        { id: 'advance-search', title: 'Advance a query in steps', html:
          '<p>Call <code>startSearch(start, goal)</code> with valid graph IDs. It creates an independent session in <code>IN_PROGRESS</code>. Call <code>advance(maxQueuePops)</code> to remove at most that many queue entries. A completed stepped query has the same result as the blocking search when the graph and callbacks remain unchanged.</p>' +
          code('import java.util.Arrays;\nimport nsk.nu.ashnav.api.path.PathSearchSession;\nimport nsk.nu.ashnav.api.path.PathSearchState;\nimport nsk.nu.ashnav.implementation.graph.AdjacencyIntGraph;\nimport nsk.nu.ashnav.implementation.path.BfsPathfinder;\n\npublic final class WikiSessionSteps {\n    public static void main(String[] args) {\n        var graph = new AdjacencyIntGraph(new int[][] {{1}, {2}, {}});\n        PathSearchSession search = new BfsPathfinder(graph).startSearch(0, 2);\n\n        var first = search.advance(1);  // Node 0 processed\n        var second = search.advance(1); // Node 1 processed\n        var third = search.advance(1);  // Node 2 processed\n\n        if (first != PathSearchState.IN_PROGRESS\n                || second != PathSearchState.IN_PROGRESS\n                || third != PathSearchState.FOUND) {\n            throw new IllegalStateException("Unexpected session state");\n        }\n        var result = search.result();\n        if (!Arrays.equals(result.path().nodes(), new int[] {0, 1, 2})\n                || result.path().totalCost() != 2.0\n                || search.queuePopCount() != 3 || search.expansionCount() != 3\n                || result.visitedNodeCount() != 3) {\n            throw new IllegalStateException("Unexpected path or counters");\n        }\n        System.out.println("FOUND: nodes=3, cost=2.0, queue pops=3");\n    }\n}', 'java', 'WikiSessionSteps.java') +
          '<p>In an event loop, keep the session and return between positive-budget calls. Ashnav does not create a scheduler, a worker thread, or an NPC controller. World points must first be converted to IDs with a <a href="#/coordinates">navigator</a>; the session API itself accepts node IDs.</p>'
        },
        { id: 'session-states', title: 'Distinguish pauses from completion', html:
          flow('Search session lifecycle', [
            ['IN_PROGRESS', 'Start here. A positive advance may stay here when its budget is exhausted.'],
            ['FOUND / UNREACHABLE', 'The goal was processed or the queue was exhausted. result() is available.'],
            ['CANCELLED', 'cancel() ends an in-progress session between steps. There is no path result.'],
            ['FAILED', 'A step threw a runtime exception or error. The failure is rethrown and the session cannot resume.']
          ], 'All terminal states remain terminal. Cancelled and failed sessions do not become UNREACHABLE, and no partial path is fabricated.') +
          table(['Call', 'Behavior'], [
            [c('advance(0)'), 'Polls the state without doing work.'],
            [c('advance(n)') + ' with n &lt; 0', 'Throws IllegalArgumentException, including after completion.'],
            [c('advance(n)') + ' after a terminal state', 'Returns that state without doing work, for non-negative n.'],
            [c('cancel()'), 'Changes IN_PROGRESS to CANCELLED; leaves every terminal state unchanged.'],
            [c('result()'), 'Returns a result only in FOUND or UNREACHABLE; otherwise throws IllegalStateException.']
          ]) + '<p>Even when start equals goal, creation returns <code>IN_PROGRESS</code>. The first positive advance processes the start and returns a one-node, cost-zero path. If validation or an initial A* heuristic call fails during <code>startSearch</code>, the call throws before a session is returned.</p>'
        },
        { id: 'work-counters', title: 'Measure the work you actually budget', html:
          '<p>A queue pop is one removal from the search queue. Weighted searches can leave old entries behind after a better distance is queued. Those stale entries consume the budget but do not expand a node.</p>' +
          table(['Counter', 'Includes', 'Does not mean'], [
            [c('queuePopCount()') + ' · long', 'Every queue removal, including stale entries.', 'Number of distinct nodes or elapsed time.'],
            [c('expansionCount()') + ' · long', 'Processed non-stale nodes, including the found goal and repeated A* processing.', 'Only rows whose neighbors were emitted; processing the goal is counted too.'],
            [c('result().visitedNodeCount()') + ' · int', 'Distinct processed nodes, including a found goal.', 'Queue insertions, all discovered nodes, or repeated expansions.']
          ]) +
          note('A queue-pop budget is not a time limit', '<p>One step processes a whole outgoing row before it returns. A high-degree node or a slow callback can take substantial time. Session creation initializes O(V) arrays, and completion reconstructs an O(L) path. Those costs, callback time, and retained memory are not bounded by <code>maxQueuePops</code>.</p>')
        },
        { id: 'cancel-and-release', title: 'Cancel and release a session', html:
          code('if (search.state() == PathSearchState.IN_PROGRESS) {\n    search.cancel();\n}\n// Drop your reference when no longer needed.\n// Keep a completed immutable result separately if you need the route.', 'java', 'Cancel between steps · excerpt') +
          '<p>A session is mutable and thread-confined. Do not call <code>advance</code> or <code>cancel</code> concurrently or from a callback. Reentrant calls throw <code>IllegalStateException</code>; an uncaught callback failure during a step marks the session <code>FAILED</code>.</p>' +
          '<p>The session retains its working arrays, queue, and graph references until your application releases it. Cancelling does not immediately free those objects. Keep graph state and captured callback data stable from creation through completion or cancellation, including pauses.</p>'
        }
      ]
    },
    {
      id: 'policies', category: 'Navigation model', title: 'Movement policies', kind: 'guide',
      description: 'Filter directed edges and replace traversal costs while retaining the base graph’s node IDs.',
      intro: '<p><code>PolicyWeightedIntGraph</code> wraps a weighted graph with an acceptance rule and a cost rule. Use it to express restrictions and penalties that your application can calculate for each directed move.</p>',
      sections: [
        { id: 'policy-flow', title: 'Filter first, then calculate policy cost', html:
          '<p>The acceptance rule receives <code>(fromNodeId, toNodeId)</code>. For an accepted weighted edge, the cost rule receives both IDs and <code>baseCost</code>. Its return value replaces the base cost; add <code>baseCost</code> yourself when you intend an additional penalty.</p>' +
          flow('Weighted policy iteration', [
            ['1. Base edge', 'Read the neighbor and its base cost in base graph order.'],
            ['2. Acceptance', 'allowed.test(from, to). False omits the edge.'],
            ['3. Cost replacement', 'For an accepted edge, cost.cost(from, to, baseCost) supplies the new value.'],
            ['4. Weighted solver', 'Dijkstra or A* receives the accepted neighbor and its replacement cost.']
          ], 'Rejected edges do not call the policy cost rule. Base weighted iteration can still read a base cost before the acceptance rule runs.') +
          '<p>BFS calls <code>forEachNeighbor</code>, so it applies acceptance but never invokes the cost rule. Policy costs must be finite and non-negative; an invalid returned value throws <code>IllegalStateException</code>.</p>'
        },
        { id: 'directed-restrictions', title: 'Add one-way movement and a cell penalty', html:
          '<p>The following 3×1×2 grid accepts every cell. The policy forbids movement toward decreasing X and raises the entry cost of cell (1,0,0) to 5. The direct route costs 6. A four-edge detour through Z=1 costs 4.</p>' +
          '<div data-diagram="policy-detour"></div>' +
          code('import java.util.Arrays;\nimport nsk.nu.ashnav.api.grid.GridNeighborhood3;\nimport nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;\nimport nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;\nimport nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;\nimport nsk.nu.ashnav.implementation.path.DijkstraPathfinder;\n\npublic final class WikiPolicyDetour {\n    public static void main(String[] args) {\n        GridWalkabilityGraph3 nodes = new GridWalkabilityGraph3(\n            new IntArrayGrid3i(3, 1, 2), value -> true, GridNeighborhood3.N6\n        );\n        int expensive = nodes.nodeOfCell(1, 0, 0);\n        PolicyWeightedIntGraph graph = new PolicyWeightedIntGraph(\n            nodes,\n            (from, to) -> nodes.cellOfNode(to).x() >= nodes.cellOfNode(from).x(),\n            (from, to, baseCost) -> to == expensive ? 5.0 : baseCost\n        );\n        var result = new DijkstraPathfinder(graph).findPath(\n            nodes.nodeOfCell(0, 0, 0), nodes.nodeOfCell(2, 0, 0)\n        );\n        if (result.path().totalCost() != 4.0\n                || !Arrays.equals(result.path().nodes(), new int[] {0, 3, 4, 5, 2})) {\n            throw new IllegalStateException("Expected the cost-4 detour");\n        }\n        System.out.println("nodes=[0, 3, 4, 5, 2], cost=4.0");\n    }\n}', 'java', 'WikiPolicyDetour.java')
        },
        { id: 'reuse-grid-mapping', title: 'Reuse the base cell mapping', html:
          '<p>A policy view preserves node IDs and node count. Pass the policy graph for traversal and the base grid for <code>GridNodeMapping3</code>. Bind the solver to the policy graph instance as well.</p>' +
          code('// mapper is a GridSpaceMapper3 configured for this grid.\nvar navigator = new SpaceMappedGridNavigator3(graph, nodes, mapper);\nvar solver = new DijkstraPathfinder(graph);\n// navigator.findPath(solver, startWorldPoint, goalWorldPoint)', 'java', 'Separate graph and mapping · excerpt') +
          '<p>The navigator checks matching node counts, but only you can ensure matching ID meanings in a custom graph/mapping pair. A solver bound to <code>nodes</code> instead of <code>graph</code> is rejected. See <a href="#/coordinates">Coordinate mapping</a> and <a href="#/frames">Coordinate frames</a> for the constructors.</p>'
        },
        { id: 'policy-lifetime', title: 'Keep policy inputs stable', html:
          '<p>The view retains its base graph and both callbacks. It does not copy captured maps, arrays, character abilities, or world state. Freeze or otherwise stabilize those inputs for the full query, including session pauses.</p>' +
          '<p>A policy can remove only existing edges and replace their costs. It does not create edges, renumber nodes, or infer clearance. For diagonal movement, your acceptance rule can inspect side cells, headroom, support, or other character requirements through your own data.</p>' +
          '<p>A direct <code>edgeCost(from, to)</code> call first asks the base graph for that edge’s cost. If acceptance rejects the existing edge, it throws <code>IllegalArgumentException</code>. Missing base edges follow the base graph’s contract.</p>'
        }
      ]
    },
    {
      id: 'results', category: 'Pathfinding', title: 'Results and errors', kind: 'reference',
      description: 'Read a completed route, interpret visited nodes, and distinguish no route from invalid input.',
      intro: '<p>A completed search returns <code>PathSearchResult</code>. Its status says whether a route exists in the queried model. The route contains node IDs and a cost; it does not retain or monitor the graph.</p>',
      sections: [
        { id: 'completed-result', title: 'Check the status before reading the path', html:
          table(['PathStatus', 'path()', 'Meaning'], [
            [c('FOUND'), 'A non-null PathResult.', 'The solver found a route from the start to the goal.'],
            [c('UNREACHABLE'), c('null'), 'No route exists in the searched graph, or a navigator endpoint has no node.']
          ]) +
          code('if (result.status() == PathStatus.FOUND) {\n    int[] route = result.path().nodes();\n    double totalCost = result.path().totalCost();\n    int distinctProcessedNodes = result.visitedNodeCount();\n} else {\n    // result.path() is null. Choose your application’s no-route behavior.\n}', 'java', 'Read a result · excerpt') +
          '<p>Built-in solvers include both endpoints in a found route. With start equal to goal, they return one node, cost zero, and <code>visitedNodeCount=1</code>. For a normal route, <code>length()</code> counts nodes, so the edge count is one less.</p>' +
          '<p><code>visitedNodeCount</code> counts distinct nodes removed for processing, including the found goal. A* can process a reopened node several times while counting it once here. Use the <a href="#/sessions">session counters</a> for queue pops and expansions.</p>'
        },
        { id: 'missing-endpoint', title: 'Distinguish missing endpoints from disconnected nodes', html:
          '<p>A navigator returns <code>unreachable(0)</code> when either mapped endpoint is blocked or outside the mapping. It does not call the solver. Call <code>nodeOfWorldPoint</code> for both points to identify this case; a missing endpoint returns <code>-1</code>.</p>' +
          flow('Endpoint checks before search', [
            ['1. Validate inputs', 'Null inputs, graph mismatch, or invalid numeric coordinates throw.'],
            ['2. Map endpoints', 'A blocked or outside cell yields no node: return UNREACHABLE with visitedNodeCount=0.'],
            ['3. Search valid IDs', 'The supplied solver returns FOUND or its normal UNREACHABLE result.']
          ], 'The sequence summarizes SpaceMappedGridNavigator3. Coordinate and frame conversions can throw; those errors are not converted into UNREACHABLE.') +
          '<p>A direct solver call with node <code>-1</code> throws <code>IllegalArgumentException</code>. Numeric mapping failures also throw instead of reporting an unreachable route. A missing endpoint, disconnected graph, and invalid coordinate are different conditions.</p>'
        },
        { id: 'immutable-values', title: 'Keep results without sharing mutable arrays', html:
          '<p><code>PathResult</code> copies its node array in the constructor and on every <code>nodes()</code> call. Changing either the original array or a returned copy does not change the result. Its equality and hash code use array contents and total cost.</p>' +
          '<p>The constructor rejects null arrays, negative IDs, and non-finite or negative total cost. It cannot validate upper ID bounds, edge connectivity, or whether the supplied cost matches those edges because it receives no graph. It permits an empty array; built-in successful searches return at least the start node.</p>' +
          '<p><code>PathSearchResult</code> rejects a null status, negative visited count, a null FOUND path, or a non-null UNREACHABLE path. Its factory methods are <code>found(path, visitedNodeCount)</code> and <code>unreachable(visitedNodeCount)</code>.</p>' +
          note('A saved route describes the old model', '<p>Rebuilding a grid snapshot can change node IDs. Retain the matching graph/mapping when interpreting an old result, or discard the old route and search the new model. The result does not revalidate changing Minecraft terrain.</p>')
        },
        { id: 'exception-reference', title: 'Identify invalid input and callback failures', html:
          table(['Condition', 'Exception / behavior', 'Where to correct it'], [
            ['Null required argument, callback, array, row, or status.', c('NullPointerException'), 'Supply the required object.'],
            ['Invalid query ID or adjacency neighbor supplied at construction.', c('IllegalArgumentException'), 'Use IDs in the graph’s valid range.'],
            ['Mismatched adjacency shapes; invalid stored cost.', c('IllegalArgumentException'), 'Align rows and supply finite non-negative costs.'],
            ['Non-positive grid dimension or volume beyond int capacity.', c('IllegalArgumentException'), 'Choose a smaller positive finite region.'],
            ['IntArrayGrid3i read/write outside its bounds.', c('IndexOutOfBoundsException'), 'Check inside(x,y,z) before access.'],
            ['Missing edge requested from a built-in weighted graph.', c('IllegalArgumentException'), 'Only request an existing directed edge.'],
            ['Graph-bound solver uses a different navigator graph instance.', c('IllegalArgumentException'), 'Construct the solver with the traversal graph passed to the navigator.'],
            ['Custom graph emits an invalid neighbor during search.', c('IllegalStateException'), 'Correct graph iteration.'],
            ['Evaluated cost, heuristic, distance, or A* priority is invalid.', c('IllegalStateException'), 'Correct numeric inputs and bounds.'],
            ['A* goal estimate is nonzero.', c('IllegalStateException'), 'Return zero for estimate(goal,goal).'],
            ['Unavailable session result or reentrant session call.', c('IllegalStateException'), 'Follow the session lifecycle and call between steps.'],
            ['A callback throws during advance.', 'The runtime exception or error is rethrown; state becomes FAILED.', 'Correct the callback before creating a new session.'],
            ['Invalid frame or coordinate mapping input.', 'Ashspace/frame validation throws; no unreachable result is fabricated.', 'See <a href="#/coordinates">coordinates</a> and <a href="#/frames">frames</a>.']
          ]) + '<p>Search checks callbacks only when evaluated. A successful result is not a validation pass over all nodes and edges. See <a href="#/troubleshooting">Troubleshooting</a> for symptom-based checks.</p>'
        }
      ]
    },
    {
      id: 'api-reference', category: 'Reference', title: 'API reference', navTitle: 'API index', kind: 'reference',
      description: 'Supported public interfaces, value types, constructors, and methods in Ashnav 2.0.0.',
      intro: '<p>All public types and members under <code>nsk.nu.ashnav.api</code> and the public graph, grid, and pathfinder classes under <code>nsk.nu.ashnav.implementation</code> are supported API. Package-private helpers and private queue records are internal.</p><p>Signatures below omit public modifiers for compactness. Standard enum methods and record-generated members follow Java’s conventions. Refer to the linked concept pages for behavior and examples.</p>',
      sections: [
        { id: 'graph-interfaces', title: 'Graph interfaces', html:
          '<p>Package: <code>nsk.nu.ashnav.api.graph</code>.</p>' +
          table(['Type', 'Members', 'Contract'], [
            [c('IntGraph'), c('int nodeCount()') + '<br>' + c('void forEachNeighbor(int nodeId, IntConsumer neighborConsumer)') + '<br>' + c('default boolean isValidNode(int nodeId)'), 'Read-only directed connectivity; valid IDs are [0,nodeCount()). Synchronous, stable neighbor order.'],
            [c('WeightedIntGraph extends IntGraph'), c('double edgeCost(int fromNodeId, int toNodeId)') + '<br>' + c('default void forEachEdge(int nodeId, IntWeightedEdgeConsumer edgeConsumer)'), 'Finite non-negative cost per ordered pair. Default edge iteration performs one cost lookup per neighbor.'],
            [c('IntWeightedEdgeConsumer'), c('void accept(int neighborNodeId, double cost)'), 'Functional consumer for a neighbor/cost pair.'],
            [c('IntEdgePredicate'), c('boolean test(int fromNodeId, int toNodeId)'), 'Functional directed-edge acceptance rule.'],
            [c('IntEdgeCost'), c('double cost(int fromNodeId, int toNodeId, double baseCost)'), 'Functional replacement-cost rule in common cost units.']
          ]) + '<p><code>IntConsumer</code> is <code>java.util.function.IntConsumer</code>. See <a href="#/graph-model">Graphs and node IDs</a> and <a href="#/policies">Movement policies</a>.</p>'
        },
        { id: 'graph-classes', title: 'Graph implementations', html:
          '<p>Package: <code>nsk.nu.ashnav.implementation.graph</code>. Each class is final.</p>' +
          table(['Class', 'Constructor', 'Public operations'], [
            [c('AdjacencyIntGraph implements IntGraph'), c('AdjacencyIntGraph(int[][] adjacency)'), c('nodeCount()') + ', ' + c('forEachNeighbor(int, IntConsumer)') + '; inherited ' + c('isValidNode(int)') + '.'],
            [c('WeightedAdjacencyIntGraph implements WeightedIntGraph'), c('WeightedAdjacencyIntGraph(int[][] neighbors, double[][] costs)'), c('nodeCount()') + ', ' + c('forEachNeighbor(int, IntConsumer)') + ', ' + c('forEachEdge(int, IntWeightedEdgeConsumer)') + ', ' + c('edgeCost(int, int)') + '; inherited ' + c('isValidNode(int)') + '.'],
            [c('PolicyWeightedIntGraph implements WeightedIntGraph'), c('PolicyWeightedIntGraph(WeightedIntGraph graph, IntEdgePredicate allowed, IntEdgeCost cost)'), 'The same graph operations as WeightedAdjacencyIntGraph. Retains callbacks and base graph; preserves IDs.']
          ])
        },
        { id: 'search-interfaces', title: 'Search and session interfaces', html:
          '<p>Package: <code>nsk.nu.ashnav.api.path</code>.</p>' +
          table(['Type', 'Members', 'Contract'], [
            [c('Pathfinder'), c('PathSearchResult findPath(int startNodeId, int goalNodeId)'), 'Functional interface. Blocking query on the supplied node IDs.'],
            [c('GraphPathfinder extends Pathfinder'), c('IntGraph graph()'), 'Exposes the non-null graph used for every query; navigators check its identity.'],
            [c('ResumablePathfinder extends GraphPathfinder'), c('PathSearchSession startSearch(int startNodeId, int goalNodeId)'), 'Creates an independent session; initialization occurs outside the advance budget.'],
            [c('IntHeuristic'), c('double estimate(int nodeId, int goalNodeId)'), 'Functional remaining-cost estimate. A* requires admissibility and h(goal)=0 for optimality.'],
            [c('PathSearchSession'), c('PathSearchState state()') + '<br>' + c('PathSearchState advance(int maxQueuePops)') + '<br>' + c('void cancel()') + '<br>' + c('PathSearchResult result()') + '<br>' + c('long queuePopCount()') + '<br>' + c('long expansionCount()'), 'Thread-confined state for one query. See <a href="#/sessions">Search sessions</a>.'],
            [c('PathSearchState'), c('IN_PROGRESS') + ', ' + c('FOUND') + ', ' + c('UNREACHABLE') + ', ' + c('CANCELLED') + ', ' + c('FAILED'), 'Session lifecycle enum.'],
            [c('PathStatus'), c('FOUND') + ', ' + c('UNREACHABLE'), 'Completed-result status enum.']
          ])
        },
        { id: 'pathfinder-classes', title: 'Built-in pathfinders', html:
          '<p>Package: <code>nsk.nu.ashnav.implementation.path</code>. Each class is final and implements <code>ResumablePathfinder</code>.</p>' +
          table(['Class', 'Constructor', 'graph() return type'], [
            [c('BfsPathfinder'), c('BfsPathfinder(IntGraph graph)'), c('IntGraph')],
            [c('DijkstraPathfinder'), c('DijkstraPathfinder(WeightedIntGraph graph)'), c('WeightedIntGraph')],
            [c('AStarPathfinder'), c('AStarPathfinder(WeightedIntGraph graph, IntHeuristic heuristic)'), c('WeightedIntGraph')]
          ]) + '<p>Every class exposes <code>findPath(int startNodeId, int goalNodeId)</code> and <code>startSearch(int startNodeId, int goalNodeId)</code> with the return types defined above. All constructors reject null required inputs. See <a href="#/solvers">Choose a pathfinder</a>.</p>'
        },
        { id: 'result-values', title: 'Result value types', html:
          '<p>Package: <code>nsk.nu.ashnav.api.path</code>.</p>' +
          code('record PathResult(int[] nodes, double totalCost) {\n    int[] nodes(); // Defensive copy\n    double totalCost();\n    int length();\n    boolean isEmpty();\n    boolean equals(Object obj);\n    int hashCode();\n    String toString();\n}\n\nrecord PathSearchResult(PathStatus status, PathResult path, int visitedNodeCount) {\n    PathStatus status();\n    PathResult path();\n    int visitedNodeCount();\n    static PathSearchResult found(PathResult path, int visitedNodeCount);\n    static PathSearchResult unreachable(int visitedNodeCount);\n}', 'java', 'Result signatures · reference') +
          '<p>Both records expose their canonical constructor. <code>PathResult</code> implements content-based array equality and defensive copies. <code>PathSearchResult</code> has ordinary record equality, hashing, and string output. Constructors validate value shape, not graph connectivity. See <a href="#/results">Results and errors</a>.</p>'
        },
        { id: 'grid-api', title: 'Grid mapping and storage', html:
          '<p>API package: <code>nsk.nu.ashnav.api.grid</code>.</p>' +
          table(['Type', 'Members'], [
            [c('GridNodeMapping3'), c('int nodeCount()') + '<br>' + c('int nodeOfCell(int x, int y, int z)') + '<br>' + c('CellIndex3 cellOfNode(int nodeId)')],
            [c('GridNeighborhood3'), 'Enum constants ' + c('N6') + ', ' + c('N18') + ', ' + c('N26') + '; ' + c('int[][] offsets()') + ' returns a deep copy.']
          ]) + '<p>Implementation package: <code>nsk.nu.ashnav.implementation.grid</code>.</p>' +
          table(['Type', 'Constructor and members'], [
            [c('GridWalkabilityGraph3 implements WeightedIntGraph, GridNodeMapping3'), c('GridWalkabilityGraph3(BoundedGrid3i grid, IntPredicate walkableValue, GridNeighborhood3 neighborhood)') + '<br>All weighted graph and node-mapping operations; ' + c('boolean isWalkableCell(int x, int y, int z)') + '.'],
            [c('IntArrayGrid3i implements BoundedGrid3i'), c('IntArrayGrid3i(int width, int height, int depth)') + '<br>' + c('int get(int x, int y, int z)') + '<br>' + c('void set(int x, int y, int z, int value)') + '<br>' + c('boolean inside(int x, int y, int z)') + '<br>' + c('int width()') + ', ' + c('int height()') + ', ' + c('int depth()')]
          ]) + '<p><code>CellIndex3</code> is <code>nsk.nu.ashgrid.api.grid.indexing.CellIndex3</code>. <code>BoundedGrid3i</code> is <code>nsk.nu.ashgrid.api.raster.BoundedGrid3i</code>. <code>IntPredicate</code> is from <code>java.util.function</code>. See <a href="#/grid-graphs">Grid graphs</a>.</p>'
        },
        { id: 'world-navigator', title: 'World-coordinate navigator', html:
          '<p><code>SpaceMappedGridNavigator3</code>, in <code>nsk.nu.ashnav.implementation.grid</code>, is final.</p>' +
          code('SpaceMappedGridNavigator3(GridWalkabilityGraph3 graph, GridSpaceMapper3 mapper)\nSpaceMappedGridNavigator3(IntGraph graph, GridNodeMapping3 nodes, GridSpaceMapper3 mapper)\n\nint nodeOfWorldPoint(Vector3 worldPoint)\nVector3 worldCenterOfNode(int nodeId)\nPathSearchResult findPath(\n    Pathfinder pathfinder, Vector3 startWorldPoint, Vector3 goalWorldPoint\n)', 'java', 'SpaceMappedGridNavigator3 · signatures') +
          '<p><code>Vector3</code> is <code>nsk.nu.ashcore.api.math.Vector3</code>. <code>GridSpaceMapper3</code> is <code>nsk.nu.ashspace.api.grid.GridSpaceMapper3</code>. The two-argument constructor uses the grid graph as its node mapping. The three-argument constructor accepts a separate traversal graph. See <a href="#/coordinates">Coordinate mapping</a>.</p>'
        },
        { id: 'frame-navigator', title: 'Frame-coordinate navigator', html:
          '<p><code>FrameMappedGridNavigator3</code>, in <code>nsk.nu.ashnav.implementation.grid</code>, is final.</p>' +
          code('FrameMappedGridNavigator3(\n    GridWalkabilityGraph3 graph, GridSpaceMapper3 gridMapper,\n    FrameGraph3 frames, FrameId gridFrame\n)\nFrameMappedGridNavigator3(\n    IntGraph graph, GridNodeMapping3 nodes, GridSpaceMapper3 gridMapper,\n    FrameGraph3 frames, FrameId gridFrame\n)\n\nint nodeOfLocalPoint(FrameId source, Vector3 localPoint)\nint nodeOfWorldPoint(Vector3 worldPoint)\nVector3 localCenterOfNode(int nodeId, FrameId target)\nVector3 worldCenterOfNode(int nodeId)\nPathSearchResult findPath(\n    Pathfinder pathfinder, FrameId startFrame, Vector3 startPoint,\n    FrameId goalFrame, Vector3 goalPoint\n)\nPathSearchResult findPath(\n    Pathfinder pathfinder, Vector3 startWorldPoint, Vector3 goalWorldPoint\n)', 'java', 'FrameMappedGridNavigator3 · signatures') +
          '<p><code>FrameGraph3</code> and <code>FrameId</code> are in <code>nsk.nu.ashspace.api.frame</code>. The navigator captures defined frame transforms at construction. The mapper’s origin and cell size are expressed in the grid frame. See <a href="#/frames">Coordinate frames</a>.</p>'
        }
      ]
    },
    {
      id: 'limits', category: 'Reference', title: 'Ordering and limits', kind: 'reference',
      description: 'Understand repeatability, ownership, numeric boundaries, and the cost of search and grid snapshots.',
      intro: '<p>Ashnav’s guarantees depend on the graph and callbacks you supply. Stable inputs include neighbor order, cost units, heuristic behavior, captured data, library versions, and the runtime environment.</p>',
      sections: [
        { id: 'repeatability', title: 'Keep all query inputs stable', html:
          '<p>Repeatability applies to the same inputs and versions in the same runtime environment. It does not promise bitwise floating-point equality across platforms or unchanged routes across releases. Different neighbor order can change BFS routes; a different heuristic can change A* ties.</p>' +
          table(['Operation', 'Observable order'], [
            ['Adjacency iteration', 'Supplied row order, including duplicates.'],
            ['Grid iteration', 'Neighborhood offset order copied from the selected Ashgrid version at enum initialization.'],
            ['BFS parent', 'First discovery in neighbor iteration order.'],
            ['Dijkstra queue / parent', 'Distance, node ID, insertion sequence; equal-cost candidates may prefer a smaller parent before settling.'],
            ['A* queue / parent', 'f=g+h, g, node ID, insertion sequence; equal-cost candidates keep the first parent.']
          ]) + '<p>None of these rules promises the lexicographically smallest whole path. Do not mutate Ashgrid’s public neighborhood arrays before Ashnav’s enum initializes if you depend on the standard offsets.</p>'
        },
        { id: 'data-ownership', title: 'Know which objects capture data', html:
          table(['Object', 'Copied or captured', 'Caller obligation'], [
            ['Adjacency graphs', 'All input rows are copied.', 'Keep constructor inputs coherent during construction. Later edits do not update the graph.'],
            ['GridWalkabilityGraph3', 'Cell acceptance and cell/node mappings are captured.', 'Keep grid dimensions, values, and predicate stable during construction; rebuild to refresh.'],
            ['PolicyWeightedIntGraph', 'Nothing from base/callback state is copied.', 'Keep the base, policies, and captured data stable for a complete query.'],
            ['SpaceMappedGridNavigator3', 'Graph, mapping, and mapper references are retained.', 'Ensure matching node meanings and stable mapping.'],
            ['FrameMappedGridNavigator3', 'Transforms for every defined frame are captured.', 'Keep the frame graph stable during capture; reconstruct to refresh transforms. Traversal data remains subject to query stability.'],
            ['PathSearchSession', 'Per-query arrays and queues; no graph snapshot.', 'Confine a session to one caller context and retain stable query inputs during pauses.'],
            ['PathResult', 'Node array copied on construction and access.', 'Interpret node IDs against the original graph state.']
          ]) + '<p>Built-in solvers keep query state local. Concurrent independent searches require safely shared graph data and thread-safe callbacks. Mutable grids need external synchronization when writes occur.</p>'
        },
        { id: 'numeric-limits', title: 'Account for rounded costs and finite coordinates', html:
          '<p>Weights, estimates, accumulated distances, and A* priorities use <code>double</code>. Evaluated values must be finite and non-negative. A non-finite evaluated sum throws <code>IllegalStateException</code>, even if another representable route might exist. Comparisons use no tolerance.</p>' +
          '<p>The usual shortest-path argument assumes exact arithmetic. Rounded sums can affect nearly equal real-number costs or heuristic bounds. Ashnav supplies no real-number error bound or guarantee for near ties. Use bounded, exactly representable integer costs when exact comparisons are required, and keep their accumulated sums exactly representable too.</p>' +
          '<p>World lookup applies Ashspace’s floor conversion and numeric limits without a boundary epsilon. Points must be finite; mapped indices must fit <code>int</code>. Very large offsets, small cells, or rotations near boundaries can lose cell detail. See <a href="#/coordinates">Coordinate mapping</a>.</p>' +
          '<p>Grid dimensions must be positive, and their product must fit <code>int</code>. The implementation rejects oversized products before allocation, including products that would overflow <code>long</code>. This is an index limit: available heap can be exhausted much earlier.</p>'
        },
        { id: 'operation-costs', title: 'Estimate construction and search work', html:
          '<p>Let V be nodes, E neighbor entries including duplicates, d(v) a row length, N=W×H×D cells, and L returned path nodes. For a weighted query, P counts all queued states, including stale ones. A counts edge emissions across expansions, X(v) counts expansions that emit node v’s row, and H is total heuristic-call work.</p>' +
          table(['Operation', 'Time', 'Additional memory'], [
            ['Adjacency construction', 'O(V+E)', 'O(V+E)'],
            ['Weighted adjacency edgeCost / forEachEdge', 'O(d(v)) / O(d(v)) plus consumer work', 'O(1), excluding consumer'],
            ['Policy construction / iteration', 'O(1) / base iteration plus policy and consumer work', 'O(1) / base temporary memory plus callbacks'],
            ['Grid snapshot construction', 'O(N) for constant-cost reads and predicate', 'O(N)'],
            ['Session creation', 'O(V); A* also calls initial estimates. Trivial BFS uses O(1).', 'O(V); trivial BFS uses O(1)'],
            ['BFS', 'O(V+E)', 'O(V), including result'],
            ['Dijkstra with constant-cost emitted edges', 'O(V+E+P log(1+P)), P ≤ E+1', 'O(V+P), including result'],
            ['A* with constant-cost emitted edges', 'O(V+A+P log(1+P)+H), P ≤ A+1', 'O(V+P), including result'],
            ['Grid lookup, edge cost, and neighbor iteration', 'O(1), at most 26 offsets, plus consumer work', 'O(1)'],
            ['World/node bridge lookup', 'O(1), excluding search and custom mapping cost', 'O(1), with coordinate allocations'],
            ['Frame capture / later mapping', 'O(F×h) / expected O(1) plus node lookup', 'O(F) / O(1)'],
            ['PathResult construction / nodes()', 'O(L) per copy', 'O(L) per copy']
          ]) + '<p>Frame capture uses F defined frames and maximum frame depth h. Search bounds assume constant-time node checks and linear row iteration, excluding consumer work. They include result storage, but do not include storage owned by the graph.</p>' +
          '<p>Native weighted adjacency and grid iteration read neighbor/cost pairs directly. If a custom graph inherits the default <code>forEachEdge</code> and scans a row in <code>edgeCost</code>, add <code>O(Σ d(v)²)</code> for Dijkstra or <code>O(Σ X(v)·d(v)²)</code> for A*. A 10,000-neighbor row can require about 50 million comparisons per expansion with a linear lookup.</p>' +
          '<p>With consistent estimates and exact arithmetic, A* expands each node at most once. With inconsistent estimates, repeated improvements can be exponential; A and P need not fit a single pass over E. The priority queue stores new states rather than decreasing one entry per node, so weighted search memory is not just O(V).</p>'
        },
        { id: 'size-and-budget', title: 'Choose a region and a work budget', html:
          flow('Grid volume scaling', [
            ['One region', 'W×H×D cells are examined when the snapshot is built.'],
            ['Double each axis', '(2W)×(2H)×(2D) = 8× the cells.'],
            ['Practical consequence', 'Construction work and snapshot storage scale with volume, including blocked cells.']
          ], 'The volume formula describes asymptotic work and storage, not a measured latency or heap allocation.') +
          '<p>Select a finite region around the navigation problem and measure it with your actual graph and callbacks. A session budget controls queue removals; it does not bound constructor work, row processing time, memory, or final path reconstruction. See <a href="#/sessions">Search sessions</a>.</p>'
        }
      ]
    },
    {
      id: 'troubleshooting', category: 'Reference', title: 'Troubleshooting', kind: 'guide',
      description: 'Diagnose missing routes, unexpected costs, stale snapshots, graph mismatch, and session failures.',
      intro: '<p>Start with the observed result or exception. Inspect endpoint IDs and graph state before changing the solver. The same pathfinder can produce different results when the model, ordering, costs, or mapping changes.</p>',
      sections: [
        { id: 'unreachable-zero', title: 'UNREACHABLE with zero visited nodes', html:
          '<p>A world-coordinate navigator uses this result when an endpoint has no node. Call <code>nodeOfWorldPoint</code> for both points. If either returns <code>-1</code>, check the mapper’s origin, cell size, grid bounds, and captured walkability.</p>' +
          '<p>Bounds exclude the maximum coordinate. With unit cells and zero origin, X=-0.2 maps to cell -1, not cell 0. If both endpoints exist but no route is found, inspect directed connectivity and policy acceptance. See <a href="#/coordinates">Coordinate mapping</a>.</p>'
        },
        { id: 'graph-mismatch', title: '“pathfinder must use the navigator graph instance”', html:
          '<p>The navigator received a <code>GraphPathfinder</code> bound to another graph object. Construct the solver with the exact traversal graph passed to the navigator. Equal node counts and identical-looking adjacency rows do not satisfy this identity check.</p>' +
          code('// graph is the policy view; nodes is the base grid mapping.\nvar navigator = new SpaceMappedGridNavigator3(graph, nodes, mapper);\nvar solver = new DijkstraPathfinder(graph);', 'java', 'Match the graph instance · excerpt') +
          '<p>Plain <code>Pathfinder</code> lambdas cannot expose this identity. Their caller must guarantee matching connectivity and node IDs. Implement <code>GraphPathfinder</code> in a custom solver to make the check available.</p>'
        },
        { id: 'unexpected-cost', title: 'The route has an unexpected cost', html:
          '<p>Check the solver first. BFS counts edges even on a weighted graph. Dijkstra and A* sum supplied costs. A grid uses cell-unit edge costs; setting world cell size to 2 does not double the returned cost.</p>' +
          '<p>For weighted adjacency, inspect duplicate neighbors: the first matching cost wins. For a policy, confirm whether the cost rule replaces the base cost or deliberately adds a penalty. For A*, test with zero estimates to check whether an overestimate caused a more expensive route.</p>'
        },
        { id: 'diagonal-clearance', title: 'A route crosses blocked side cells', html:
          '<p>N18 and N26 connect accepted endpoint cells along diagonals. They do not check intervening side cells, body clearance, support, or headroom. In a 2×2 horizontal square, opposite accepted corners connect even if both side cells are blocked.</p>' +
          '<p>Use N6 to remove diagonal edges, or supply a directed acceptance policy that checks your character’s full movement requirements. N6 alone still does not establish Minecraft walking, jumping, or falling rules. See <a href="#/grid-graphs">Grid graphs</a> and <a href="#/policies">Movement policies</a>.</p>'
        },
        { id: 'stale-state', title: 'Grid or frame edits do not change the route', html:
          '<p><code>GridWalkabilityGraph3</code> captures cell acceptance at construction. Rebuild the graph, solver, and navigator after the source region changes. A rebuild may assign different IDs, so discard old IDs or keep them with their original mapping.</p>' +
          '<p><code>FrameMappedGridNavigator3</code> captures frame transforms at construction. Reconstruct it after frame edits when the query must use the updated placement. Newly defined frames were not captured and are rejected. Policy callbacks are retained instead of captured: their data must remain stable during a query.</p>'
        },
        { id: 'session-state-errors', title: 'A session stays IN_PROGRESS or has no result', html:
          '<p><code>advance(0)</code> only polls. Call with a positive budget to do work. Repeated <code>IN_PROGRESS</code> states can mean the budget is being consumed by remaining work, including stale queue entries.</p>' +
          '<p>Read <code>result()</code> only after <code>FOUND</code> or <code>UNREACHABLE</code>. Cancellation has no partial result. A failure during a step is rethrown and leaves <code>FAILED</code>; fix the callback or numeric cause and create a new session.</p>' +
          '<p>If a small budget still causes a long pause, measure the whole outgoing row and your callbacks. Session initialization and final route reconstruction also sit outside the queue-pop budget. See <a href="#/sessions">Search sessions</a>.</p>'
        },
        { id: 'numeric-errors', title: 'A cost, estimate, or coordinate is rejected', html:
          '<p>For weights and A* estimates, reject negative numbers, NaN, and infinity before search. Return zero at the goal. Bound accumulated cost and <code>g+h</code> so they remain finite. A different valid route does not suppress an overflow encountered during evaluated work.</p>' +
          '<p>For coordinates, use finite points and a mapper whose resulting cell indices fit <code>int</code>. Check origin and scale before assuming a boundary issue. Ashnav adds no epsilon to cell membership. For dimensions, use positive values whose product fits <code>int</code>, and account separately for heap capacity.</p>'
        },
        { id: 'dependency-conflict', title: 'A consumer cannot find a lower-layer method', html:
          '<p>Check the resolved dependency graph against Ashnav 2.0.0’s baseline: Ashcore 1.2.0, Ashgrid 1.3.0, and Ashspace 2.0.0. A parent POM or another library can force an older version and hide required APIs.</p>' +
          code('mvn dependency:tree', 'powershell', 'Consumer project · PowerShell') +
          '<p>Review version overrides before rebuilding the consumer. See <a href="#/installation">Installation</a> and <a href="#/releases">Release and migration notes</a>. Ashnav is a Java library; it supplies no server command or reload action to correct dependency resolution.</p>'
        }
      ]
    },
    {
      id: 'glossary', category: 'Reference', title: 'Glossary', kind: 'reference',
      description: 'The terms used throughout the Ashnav wiki, tied to their API meaning.',
      intro: '<p>These definitions describe Ashnav 2.0.0. A cell, node, world point, and movement edge are separate objects; converting one does not establish the others’ physical meaning.</p>',
      sections: [
        { id: 'model-terms', title: 'Graph and movement terms', html:
          table(['Term', 'Meaning'], [
            ['Graph', 'A set of nodes and permitted directed edges.'],
            ['Node / node ID', 'A place in one graph, identified by an integer in [0,nodeCount()). It is not a global Minecraft coordinate.'],
            ['Edge', 'An allowed directed move from one node to another. Repeated emissions of one ordered pair share its cost.'],
            ['Neighbor', 'A node reached by one outgoing edge from the current node.'],
            ['Cost', 'A common caller-defined quantity minimized by weighted solvers. BFS always uses edge count.'],
            ['Policy', 'A callback that accepts a directed edge or supplies its replacement cost.'],
            ['Walkability', 'The caller’s rule that accepts an endpoint cell during graph construction. It does not prove movement clearance.'],
            ['Snapshot', 'Fixed acceptance and cell/node mappings captured from the grid at construction. Later source edits do not change it.']
          ])
        },
        { id: 'search-terms', title: 'Search terms', html:
          table(['Term', 'Meaning'], [
            ['Route / path', 'The ordered sequence of graph node IDs returned for a found query, plus its total cost.'],
            ['Heuristic', 'An estimate of remaining cost used to prioritize A* work.'],
            ['Admissible', 'A heuristic never exceeds the cheapest remaining cost.'],
            ['Consistent', 'A heuristic satisfies h(u) ≤ edgeCost(u,v)+h(v) for every edge.'],
            ['g score / f score', 'A* accumulated cost so far / accumulated cost plus heuristic estimate.'],
            ['Settled / closed node', 'A node already processed. Dijkstra keeps it settled; A* may reopen it after a strictly cheaper route.'],
            ['Queue pop', 'One removal from the search queue, including removal of a stale entry.'],
            ['Expansion', 'Processing a non-stale node. The counter includes a found goal and repeated A* processing.'],
            ['Visited node count', 'Distinct processed nodes in a completed result, including a found goal.'],
            ['Session', 'Mutable state of one stepped, caller-scheduled query.'],
            ['Unreachable', 'No route in the query graph, or a missing endpoint reported by a navigator.'],
            ['Cancelled / failed', 'Terminal session states without a path result; neither means unreachable.']
          ])
        },
        { id: 'coordinate-terms', title: 'Grid and coordinate terms', html:
          table(['Term', 'Meaning'], [
            ['Cell', 'An integer-indexed location in a finite grid. Only accepted cells receive graph nodes.'],
            ['Neighborhood', 'The selected set of offsets connecting accepted endpoint cells: N6, N18, or N26.'],
            ['Cell units', 'Grid-edge cost units: face steps cost 1, edge diagonals √2, and corner diagonals √3.'],
            ['World point', 'A position expressed in the world frame. It maps to a cell by floor conversion.'],
            ['Cell center', 'The center returned for a mapped node; it need not equal the original endpoint point.'],
            ['Frame', 'A coordinate system related to other Ashspace frames by rigid transforms.'],
            ['Grid frame', 'The frame in which a frame navigator’s grid mapper origin and cell size are expressed.'],
            ['Captured transform', 'A frame-to-grid or grid-to-frame transform retained at navigator construction.'],
            ['Half-open bounds', 'Bounds include the minimum and exclude the maximum: [0,width), [0,height), [0,depth).']
          ])
        }
      ]
    },
    {
      id: 'releases', category: 'Reference', title: 'Release and migration notes', navTitle: 'Migration', kind: 'reference',
      description: 'What Ashnav 2.0.0 changes, which public APIs remain, and what to check when upgrading.',
      intro: '<p>This wiki documents Ashnav <strong>2.0.0</strong>, using JDK 21 or newer. Releases follow Semantic Versioning. The changes below describe the current source and published project documentation; they are not a roadmap.</p>',
      sections: [
        { id: 'version-two', title: 'Ashnav 2.0.0', html:
          table(['Area', 'Change', 'Effect on callers'], [
            ['A* correctness and ties', 'Reopens nodes after strictly cheaper routes; retains the first equal-cost parent; requires h(goal)=0.', 'Inconsistent admissible heuristics can return better routes. Existing expected route sequences can change.'],
            ['Validation', 'Rejects mismatched graph-bound solvers and invalid grid dimensions/volumes.', 'Previously misleading inputs can now throw.'],
            ['Stepped search', 'Adds ResumablePathfinder, PathSearchSession, and PathSearchState.', 'Callers can budget queue removals and cancel between steps. Blocking and stepped searches share the same engine.'],
            ['Policy views', 'Adds directed acceptance and replacement-cost callbacks through PolicyWeightedIntGraph.', 'Compose movement restrictions and penalties while preserving IDs.'],
            ['Weighted edge iteration', 'Adds a compatible default forEachEdge and native paired iteration in built-in weighted graphs.', 'Custom graphs keep working; an override can avoid repeated linear cost lookups.'],
            ['Separate mapping', 'Adds graph/mapping navigator overloads and the GridNodeMapping3 contract.', 'Policy views can use the base grid mapping.'],
            ['Frame navigation', 'Provides FrameMappedGridNavigator3 with transforms captured at construction.', 'Convert endpoints and centers between captured Ashspace frames.'],
            ['Dependency baseline', 'Ashcore 1.2.0, Ashgrid 1.3.0, Ashspace 2.0.0.', 'Use these release dependencies and check consumer overrides.']
          ]) + '<p>The major version reflects observable changes in A* ties and validation. Existing method and constructor signatures remain. <code>Pathfinder</code> remains a functional interface. No public type is moved or deprecated in 2.0.0; duplicate-edge first-cost behavior is unchanged.</p>'
        },
        { id: 'migration-checks', title: 'Upgrade an existing consumer', html:
          '<ol><li>Update the dependency to <code>dev.nasaka.blackframe:ashnav:2.0.0</code> and use JDK 21 or newer.</li><li>Check resolved Ashcore, Ashgrid, and Ashspace versions for older overrides.</li><li>Use Dijkstra or zero A* estimates if the existing heuristic has no proven lower-bound property.</li><li>Construct each graph-bound solver with the exact traversal graph used by its navigator.</li><li>Check positive grid dimensions and a volume that fits int before constructing snapshots.</li><li>Revalidate any tests that require a particular equal-cost route sequence.</li></ol>' +
          '<p>The original navigator constructors remain available. Use the graph/mapping overload only when traversal and cell mapping are separate objects. Existing custom weighted graphs inherit <code>forEachEdge</code>; preserve its neighbor order and pair-cost semantics if you override it.</p>' +
          '<p><code>IntArrayGrid3i</code> remains a supported compatibility helper with its existing constructor and positive-dimension rule. For new general storage code, Ashgrid’s <code>nsk.nu.ashgrid.implementation.raster.arrays.ArrayGrid3i</code> provides the bounded grid interface. Storage ownership remains in Ashgrid.</p>'
        },
        { id: 'lower-layer-versions', title: 'Keep compatible lower-layer versions', html:
          '<p>Ashspace 1.0.0 can round a tiny negative point outside a grid into cell 0. The selected Ashspace 2.0.0 baseline preserves the boundary side. Older lower-layer versions can also hide APIs required when Ashnav is combined with current Ashtrace in one consumer.</p>' +
          '<p>Do not force older dependency versions into this configuration. The coordinates and frame pages describe the current mapper behavior, including remaining double-precision limits. Ashnav defines no serialized wire format or saved-route schema.</p>' +
          cards([['installation', 'Install 2.0.0', 'Dependency coordinates and source build requirements.'], ['limits', 'Ordering and limits', 'Behavior that can affect route comparisons and upgrade checks.']])
        }
      ]
    }
  );
})();
