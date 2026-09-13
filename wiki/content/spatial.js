(() => {
  'use strict';
  const {code, table, note, cards} = window.WIKI_DOCS;
  const gridExample = `import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;

public final class AshnavDiagonalExample {
    public static void main(String[] args) {
        IntArrayGrid3i cells = new IntArrayGrid3i(2, 1, 2);
        cells.set(0, 0, 0, 1);
        cells.set(1, 0, 1, 1);
        for (GridNeighborhood3 neighborhood : GridNeighborhood3.values()) {
            GridWalkabilityGraph3 graph = new GridWalkabilityGraph3(
                    cells, value -> value == 1, neighborhood);
            var result = new DijkstraPathfinder(graph).findPath(0, 1);
            boolean diagonal = neighborhood != GridNeighborhood3.N6;
            if ((result.status() == PathStatus.FOUND) != diagonal) {
                throw new IllegalStateException("Unexpected diagonal connectivity");
            }
            if (diagonal && result.path().totalCost() != Math.sqrt(2.0)) {
                throw new IllegalStateException("Unexpected diagonal cost");
            }
            System.out.println(neighborhood + "=" + result.status());
        }
        GridWalkabilityGraph3 snapshot = new GridWalkabilityGraph3(
                cells, value -> value == 1, GridNeighborhood3.N6);
        cells.set(0, 0, 0, 0);
        if (snapshot.nodeOfCell(0, 0, 0) != 0) {
            throw new IllegalStateException("Snapshot changed with its source");
        }
    }
}`;
  const mappingExample = `import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

public final class AshnavMappingExample {
    public static void main(String[] args) {
        var nodes = new GridWalkabilityGraph3(new IntArrayGrid3i(3, 1, 1),
                value -> true, GridNeighborhood3.N6);
        var mapper = new GridSpaceMapper3(2.0, new Vector3(-4.0, 8.0, 16.0),
                new SquareXZChunkScheme(16));
        var navigator = new SpaceMappedGridNavigator3(nodes, mapper);
        int start = navigator.nodeOfWorldPoint(new Vector3(-3.0, 9.0, 17.0));
        int goal = navigator.nodeOfWorldPoint(new Vector3(1.0, 9.0, 17.0));
        int outside = navigator.nodeOfWorldPoint(new Vector3(2.0, 9.0, 17.0));
        int below = navigator.nodeOfWorldPoint(new Vector3(-4.1, 9.0, 17.0));
        if (start != 0 || goal != 2 || outside != -1 || below != -1) {
            throw new IllegalStateException("Unexpected cell membership");
        }
        if (!navigator.worldCenterOfNode(0).equals(new Vector3(-3.0, 9.0, 17.0))) {
            throw new IllegalStateException("Unexpected cell center");
        }
        System.out.println("start=" + start + ", goal=" + goal + ", outside=" + outside);
    }
}`;
  const frameExample = `import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class AshnavFrameExample {
    public static void main(String[] args) {
        var nodes = new GridWalkabilityGraph3(new IntArrayGrid3i(3, 1, 1),
                value -> true, GridNeighborhood3.N6);
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId vehicle = new FrameId("vehicle");
        frames.define(vehicle, frames.root(), RigidTransform3.translation(10, 0, 20));
        var mapper = new GridSpaceMapper3(1.0, Vector3.ZERO, new SquareXZChunkScheme(16));
        var navigator = new FrameMappedGridNavigator3(nodes, mapper, frames, vehicle);
        var result = navigator.findPath(new DijkstraPathfinder(nodes),
                vehicle, new Vector3(0.5, 0.5, 0.5),
                frames.root(), new Vector3(12.5, 0.5, 20.5));
        if (result.status() != PathStatus.FOUND || result.path().totalCost() != 2.0) {
            throw new IllegalStateException("Expected a two-edge local route");
        }
        Vector3 center = navigator.worldCenterOfNode(0);
        if (!center.equals(new Vector3(10.5, 0.5, 20.5))) {
            throw new IllegalStateException("Unexpected transformed center");
        }
        System.out.println("cost=" + result.path().totalCost() + ", centerX=" + center.x());
    }
}`;

  window.WIKI_PAGES.push(
    {
      id:'grid-graphs',category:'Navigation model',title:'Grid graphs',kind:'concept',
      description:'Turn accepted cells into a finite graph, choose a neighborhood, and understand what the snapshot guarantees.',
      intro:'<p>A grid stores values at integer coordinates. <code>GridWalkabilityGraph3</code> evaluates your predicate once per cell and assigns a node to each accepted cell. A neighborhood selects which nearby accepted cells connect.</p>',
      sections:[
        {id:'snapshot',title:'Capture walkable cells',html:`<p>Provide an Ashgrid <code>BoundedGrid3i</code>, an <code>IntPredicate</code>, and a <code>GridNeighborhood3</code>. Keep the dimensions, values, and predicate state fixed during construction. Later edits do not change the graph. Rebuild the graph, its solver, and its navigator to use new world data.</p>
        <figure class="nav-figure rounded border border-line bg-surface p-4"><svg viewBox="0 0 580 125" role="img" aria-label="Stable grid and predicate are captured as a graph; later source edits require a new capture"><g fill="none" stroke="var(--border)"><rect x="5" y="20" width="145" height="66" rx="5"/><rect x="217" y="20" width="160" height="66" rx="5"/><rect x="442" y="20" width="132" height="66" rx="5"/></g><g text-anchor="middle"><text x="77" y="47">Grid + predicate</text><text x="77" y="68">fixed during capture</text><text x="184" y="56">→</text><text x="297" y="47">Graph snapshot</text><text x="297" y="68">cell ↔ node mapping</text><text x="409" y="56">→</text><text x="507" y="47">Search</text><text x="507" y="68">old IDs stay fixed</text></g></svg><figcaption>Changing the source after capture leaves the existing graph unchanged. A rebuilt graph may assign different IDs; keep a result with the mapping used to find it.</figcaption></figure>
        <p><code>IntArrayGrid3i</code> is a mutable, zero-filled compatibility grid supplied by Ashnav. A value of <code>1</code> means walkable only when your predicate defines it that way. Any <code>BoundedGrid3i</code> implementation can supply the cells.</p>`},
        {id:'neighborhoods',title:'Choose the allowed offsets',html:`<p>N6 connects cells sharing a face. N18 adds diagonals across two axes. N26 also adds diagonals across three axes. Each endpoint must be inside the grid and accepted by the predicate.</p><div data-diagram="neighborhood"></div>${table(['Neighborhood','Possible neighbors','Edge costs in cell units'],[['<code>N6</code>','6','1'],['<code>N18</code>','18','1 or √2'],['<code>N26</code>','26','1, √2, or √3']])}<p>Counts describe an interior cell surrounded by accepted cells. Borders and blocked cells reduce its actual degree. Offsets returned by <code>offsets()</code> are deep copies. Their iteration order comes from the selected Ashgrid version at enum initialization.</p>`},
        {id:'diagonal-clearance',title:'A diagonal does not check clearance',html:`<p>In this 2 × 1 × 2 grid, only cells (0, 0, 0) and (1, 0, 1) are accepted. N18 and N26 connect them with cost √2 even though both side cells are blocked. N6 returns <code>UNREACHABLE</code>.</p>
        <figure class="nav-figure rounded border border-line bg-surface p-4"><svg viewBox="0 0 480 210" role="img" aria-label="XZ slice with two diagonal walkable cells and two blocked side cells"><g stroke="var(--border)"><rect x="35" y="15" width="85" height="85" fill="var(--accent-soft)"/><rect x="120" y="15" width="85" height="85" fill="var(--bg)"/><rect x="35" y="100" width="85" height="85" fill="var(--bg)"/><rect x="120" y="100" width="85" height="85" fill="var(--accent-soft)"/></g><path d="M78 58 L162 142" stroke="var(--accent)" stroke-width="3" stroke-dasharray="5 4"/><g text-anchor="middle"><text x="78" y="42">node 0</text><text x="162" y="62">blocked</text><text x="78" y="146">blocked</text><text x="162" y="169">node 1</text></g><text x="236" y="64">Y = 0 (XZ slice)</text><text x="236" y="95">N6: no route</text><text x="236" y="126">N18 / N26: cost √2</text><text x="236" y="157">X →   Z ↓</text></svg><figcaption>The dashed segment connects accepted endpoints. It does not establish that a character can pass between the blocked cells.</figcaption></figure>
        ${code(gridExample,'java','AshnavDiagonalExample.java')}${code('N6=UNREACHABLE\nN18=FOUND\nN26=FOUND','output','Expected output')}${note('Supply movement rules','<p>Encode support, headroom, body clearance, jumps, and drops in your model. A <a href="#/policies">policy graph</a> can reject directed edges without changing node IDs.</p>')}`},
        {id:'cell-identifiers',title:'Look up cells and node IDs',html:`${table(['Operation','Contract'],[['<code>nodeOfCell(x, y, z)</code>','Returns a node ID, or −1 for a blocked or outside cell.'],['<code>cellOfNode(nodeId)</code>','Returns an Ashgrid <code>CellIndex3</code>. Invalid IDs throw <code>IllegalArgumentException</code>.'],['<code>isWalkableCell(x, y, z)</code>','Returns whether the captured cell has a node.'],['<code>nodeCount()</code>','Number of accepted cells. An all-blocked grid has zero nodes.']])}<p>IDs start at zero. X changes fastest, then Y, then Z; blocked cells consume no ID. Bounds are <code>[0, width) × [0, height) × [0, depth)</code>. All dimensions must be positive and their product must fit <code>int</code>. Available JVM memory may impose a smaller practical limit.</p>`}
      ]
    },
    {
      id:'coordinates',category:'Navigation model',title:'World coordinates',kind:'concept',
      description:'Map world points to node IDs and convert a found route back to cell centers.',
      intro:'<p>A graph uses integer IDs. Your plugin usually has positions in a world. <code>SpaceMappedGridNavigator3</code> joins a cell-to-node mapping to Ashspace’s <code>GridSpaceMapper3</code>. Ashcore supplies the <code>Vector3</code> values used for positions.</p>',
      sections:[
        {id:'membership',title:'Find the cell containing a point',html:`<p>The mapper uses right-handed coordinates with Y up. Set a finite positive cell size and an origin in world units. On each axis, cell lookup follows <code>floor((world − origin) / cellSize)</code> with Ashspace’s floating-point rules. The origin is the minimum corner of cell (0, 0, 0).</p><p>With origin (−4, 8, 16) and cell size 2, point (−3, 9, 17) is the center of cell (0, 0, 0). Point (1, 9, 17) maps to cell (2, 0, 0). The three-cell corridor occupies X in <code>[−4, 2)</code>; X = 2 is outside.</p><div data-diagram="world-mapping"></div>${note('Floor includes negative coordinates','<p>At zero origin and unit size, X = −0.2 maps to cell −1. Casting a double to int truncates toward zero and does not implement this rule. There is no boundary epsilon.</p>')}`},
        {id:'mapping-example',title:'Check endpoints and centers',html:`${code(mappingExample,'java','AshnavMappingExample.java')}${code('start=0, goal=2, outside=-1','output','Expected output')}<p><code>worldCenterOfNode</code> returns a cell center, even if the original query point was elsewhere inside that cell. A route still consists of node IDs. Convert its nodes through the same navigator before using the centers in your plugin.</p>`},
        {id:'bind-graph',title:'Use one graph and one ID meaning',html:`<p>The two-argument constructor uses a <code>GridWalkabilityGraph3</code> for traversal and mapping. The three-argument constructor accepts <code>(IntGraph graph, GridNodeMapping3 nodes, GridSpaceMapper3 mapper)</code>. Use it with a policy view and the base grid mapping.</p>${code('SpaceMappedGridNavigator3 navigator = new SpaceMappedGridNavigator3(\n        graph, nodes, mapper\n);','java','Constructor fragment')}<p>Matching node counts are checked during construction. You must also ensure that each ID means the same cell in both objects. Built-in solvers expose <code>graph()</code>; a navigator rejects a solver bound to a different graph instance. For a plain <code>Pathfinder</code> lambda, graph identity cannot be inspected.</p>`},
        {id:'missing-endpoint',title:'Distinguish a missing endpoint from no route',html:`${table(['Condition','Result'],[['A mapped endpoint is blocked or outside','<code>UNREACHABLE</code>, <code>visitedNodeCount=0</code>; the solver is not invoked.'],['Both endpoints have nodes, but no route connects them','The solver returns its unreachable result.'],['A point or required object is null','<code>NullPointerException</code>.'],['A coordinate is non-finite, or a computed cell index does not fit int','Ashspace throws <code>IllegalArgumentException</code>.'],['A <code>GraphPathfinder</code> uses another graph instance','<code>IllegalArgumentException</code>, before the search.']])}<p>Call <code>nodeOfWorldPoint</code> for each endpoint to identify missing nodes. Invalid numeric input is an error, not an unreachable route.</p>`},
        {id:'units-precision',title:'Keep coordinate units separate from costs',html:`<p>Mapping never rescales graph costs. Two N6 edges cost 2 cell units even when each cell is two world units wide. Define any time, risk, or distance-based costs in your graph or policy, and choose a matching A* heuristic.</p><p>The browser diagram covers ordinary finite values. Ashspace additionally checks numeric ranges and preserves underflow signs when selecting cells. Large origins, very small cells, and rounded transform results can lose cell detail. A generated center is not guaranteed to round-trip at numeric extremes.</p>${cards([['frames','Local frames','Attach the grid to a captured coordinate frame.'],['solvers','Choose a solver','Match the optimization objective and heuristic to graph costs.']])}`}
      ]
    },
    {
      id:'frames',category:'Navigation model',title:'Local frames',kind:'concept',
      description:'Attach a grid to an Ashspace frame and query points from captured world or local coordinate systems.',
      intro:'<p>A local frame describes positions relative to an object, such as a vehicle. <code>FrameMappedGridNavigator3</code> captures the transforms between Ashspace frames and a grid frame. Start and goal points can then use different captured frames.</p>',
      sections:[
        {id:'attached-grid',title:'Place a corridor on a vehicle',html:`<p>This vehicle frame has no rotation and is translated by (10, 0, 20) world units. Its grid has three unit cells along local X. Node 0 is centered at local (0.5, 0.5, 0.5), which becomes world (10.5, 0.5, 20.5).</p><figure class="nav-figure rounded border border-line bg-surface p-4"><svg viewBox="0 0 610 250" role="img" aria-label="Fixed 3D projection of a translated local corridor and its Y-up axes"><g stroke="var(--muted)" fill="none"><path d="M78 194 V112 M78 194 L160 208 M78 194 L28 225"/><path d="M272 164 V72 M272 164 L458 197 M272 164 L213 201"/></g><g fill="var(--accent-soft)" stroke="var(--accent)"><path d="M272 130 l48 9 -27 17 -48 -9 Z M245 147 v32 l48 9 v-32 M293 188 l27 -17 v-32"/><path d="M320 139 l48 9 -27 17 -48 -9 Z M293 156 v32 l48 9 v-32 M341 197 l27 -17 v-32"/><path d="M368 148 l48 9 -27 17 -48 -9 Z M341 165 v32 l48 9 v-32 M389 206 l27 -17 v-32"/></g><path d="M93 186 L235 165" fill="none" stroke="var(--accent)" stroke-dasharray="4 4"/><text x="87" y="109">Y ↑</text><text x="165" y="218">X</text><text x="13" y="239">Z</text><text x="38" y="90">World</text><text x="275" y="64">Local Y ↑</text><text x="455" y="215">Local X</text><text x="213" y="225">Local Z</text><text x="121" y="153">(10, 0, 20)</text><text x="310" y="110">Vehicle frame</text><text x="262" y="172">0</text><text x="310" y="181">1</text><text x="358" y="190">2</text><text x="245" y="36">world center of node 0 = (10.5, 0.5, 20.5)</text></svg><figcaption>Fixed 3D projection with Y up. The translation arrow is schematic, not drawn to scale. The three cells keep their IDs and edge costs when expressed in world coordinates. The example applies translation only.</figcaption></figure>${code(frameExample,'java','AshnavFrameExample.java')}${code('cost=2.0, centerX=10.5','output','Expected output')}`},
        {id:'capture',title:'Refresh captured transforms explicitly',html:`<p>Keep the frame graph fixed while constructing the navigator. It captures transforms for every defined frame, not just the grid frame. Later movement, removal, or editing of frames does not update those captures. A frame ID added afterwards is unknown to the existing navigator.</p><p>Construct a new navigator to refresh transforms. Rebuild the grid graph as well when walkability changes. Capturing frames does not copy the traversal graph or policy callbacks; those inputs must still remain stable throughout a query and its session pauses.</p>${note('The mapper describes the grid frame','<p>Pass origin and cell size in <code>gridFrame</code> coordinates, despite <code>GridSpaceMapper3</code> having world-named methods. Converting a world point first transforms it into that grid frame, then performs floor-based cell lookup.</p>')}`},
        {id:'frame-api',title:'Read and query captured frames',html:`${table(['Method','Input and result'],[['<code>nodeOfLocalPoint(source, point)</code>','A point in a captured source frame; returns its grid node or −1.'],['<code>nodeOfWorldPoint(point)</code>','A point in the captured frame graph’s root coordinates; returns its grid node or −1.'],['<code>localCenterOfNode(nodeId, target)</code>','Returns the cell center expressed in a captured target frame.'],['<code>worldCenterOfNode(nodeId)</code>','Returns the center in the root frame.'],['<code>findPath(solver, startFrame, startPoint, goalFrame, goalPoint)</code>','Converts both endpoints through the same captured transforms and runs the supplied solver.'],['<code>findPath(solver, startWorldPoint, goalWorldPoint)</code>','Queries two root-frame points.']])}<p>Null objects throw <code>NullPointerException</code>. Unknown frame IDs throw <code>IllegalArgumentException</code>. The graph identity and missing-endpoint rules are the same as in <a href="#/coordinates">world navigation</a>. Rigid transforms preserve units; they do not rescale graph costs.</p>`},
        {id:'frame-limits',title:'Account for capture and numeric limits',html:'<p>For F frames and maximum depth h, capture takes O(F × h) time and O(F) retained memory. Later conversions take expected O(1) time plus the cost of the node mapping. Ashspace composes and inverts the transforms.</p><p>Rotation may put a rounded point on either side of a cell boundary. No boundary epsilon or exact round-trip guarantee is added by Ashnav. Use points away from boundaries when testing ordinary membership, and test boundaries separately when your application depends on them.</p>'}
      ]
    }
  );
})();
