/* Ashnav 2.0.0 guides. HTML is authored locally; examples use the published API. */
(() => {
  const { code, table, note, cards } = window.WIKI_DOCS;

  const flowFigure = `<figure class="my-6 rounded-[7px] border border-line bg-surface p-[18px]">
    <div class="overflow-x-auto"><svg viewBox="0 0 660 214" class="block w-full min-w-[580px]" role="img" aria-labelledby="flow-title flow-description">
      <title id="flow-title">From a navigation model to a route</title>
      <desc id="flow-description">Your graph or grid supplies nodes and allowed edges. A solver uses start and goal node IDs and returns a node sequence and cost. Optional coordinate mapping connects world points to the same node IDs.</desc>
      <defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="1.4"><rect x="8" y="26" width="178" height="78" rx="7"/><rect x="242" y="26" width="176" height="78" rx="7"/><rect x="474" y="26" width="178" height="78" rx="7"/>
        <path d="M 188 65 H 237 M 420 65 H 469" marker-end="url(#flow-arrow)"/>
        <rect x="127" y="148" width="406" height="48" rx="7" stroke-dasharray="5 4"/>
        <path d="M 242 148 V 125 H 97 V 108 M 418 148 V 125 H 563 V 108" marker-end="url(#flow-arrow)"/></g>
      <g fill="currentColor" text-anchor="middle" font-family="sans-serif"><text x="97" y="55" font-size="16" font-weight="600">Your graph</text><text x="97" y="80" font-size="13">Nodes, edges, costs</text><text x="330" y="55" font-size="16" font-weight="600">Pathfinder</text><text x="330" y="80" font-size="13">Start → goal</text><text x="563" y="55" font-size="16" font-weight="600">Search result</text><text x="563" y="80" font-size="13">Node sequence + cost</text><text x="330" y="178" font-size="14">Optional mapping: world points ↔ node IDs</text></g>
    </svg></div><figcaption>The solver works on node IDs. Coordinate mapping translates positions; it does not change connectivity or rescale costs.</figcaption>
  </figure>`;

  const corridorFigure = `<figure class="my-6 rounded-[7px] border border-line bg-surface p-[18px]">
    <div class="overflow-x-auto"><svg viewBox="0 0 660 240" class="block w-full min-w-[560px]" role="img" aria-labelledby="corridor-title corridor-description">
      <title id="corridor-title">Quick start corridor, viewed along the X axis</title>
      <desc id="corridor-description">Three cells span world X from minus four inclusive to two exclusive. Cell centers are minus three, minus one, and one. The start is node zero and the goal is node two. Each edge costs one cell unit.</desc>
      <defs><marker id="corridor-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="60" y="49" width="180" height="98"/><rect x="240" y="49" width="180" height="98"/><rect x="420" y="49" width="180" height="98"/><path d="M 171 101 H 304 M 351 101 H 484" marker-end="url(#corridor-arrow)"/><path d="M 60 190 H 620" marker-end="url(#corridor-arrow)"/><path d="M 60 183 V 197 M 240 183 V 197 M 420 183 V 197 M 600 183 V 197"/></g>
      <g fill="currentColor" text-anchor="middle" font-family="sans-serif"><text x="330" y="25" font-size="14">Y = 9, Z = 17 world units · each cell is 2 units wide</text><text x="150" y="74" font-size="14">Cell (0, 0, 0)</text><text x="330" y="74" font-size="14">Cell (1, 0, 0)</text><text x="510" y="74" font-size="14">Cell (2, 0, 0)</text><text x="150" y="106" font-size="18" font-weight="600">0</text><text x="330" y="106" font-size="18" font-weight="600">1</text><text x="510" y="106" font-size="18" font-weight="600">2</text><text x="150" y="132" font-size="13">Start · X = −3</text><text x="330" y="132" font-size="13">Center · X = −1</text><text x="510" y="132" font-size="13">Goal · X = 1</text><text x="240" y="170" font-size="13">cost 1</text><text x="420" y="170" font-size="13">cost 1</text><text x="60" y="218" font-size="13">−4</text><text x="240" y="218" font-size="13">−2</text><text x="420" y="218" font-size="13">0</text><text x="600" y="218" font-size="13">2</text><text x="641" y="195" font-size="13">X</text></g>
    </svg></div><figcaption>A 2D slice of the 3 × 1 × 1 grid. The path contains nodes [0, 1, 2] and costs 2 cell units. The centers are 4 world units apart.</figcaption>
  </figure>`;

  const weightedFigure = `<figure class="my-6 rounded-[7px] border border-line bg-surface p-[18px]">
    <svg viewBox="0 0 620 218" class="block w-full" role="img" aria-labelledby="weighted-title weighted-description">
      <title id="weighted-title">Fewest edges and lowest cost choose different routes</title><desc id="weighted-description">The directed edge from S to G costs ten. S to A costs one and A to G costs one. BFS chooses the one-edge route. Dijkstra chooses the two-edge route costing two.</desc>
      <defs><marker id="weighted-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="76" cy="72" r="28"/><circle cx="544" cy="72" r="28"/><circle cx="310" cy="174" r="28"/><path d="M 106 72 H 509 M 105 88 L 278 162 M 340 162 L 513 88" marker-end="url(#weighted-arrow)"/></g>
      <g fill="currentColor" font-family="sans-serif" text-anchor="middle"><text x="76" y="78" font-size="17">S · 0</text><text x="544" y="78" font-size="17">G · 2</text><text x="310" y="180" font-size="17">A · 1</text><text x="310" y="55" font-size="15">cost 10 · BFS chooses one edge</text><text x="172" y="155" font-size="15">cost 1</text><text x="448" y="155" font-size="15">cost 1</text><text x="310" y="116" font-size="14">Dijkstra chooses cost 1 + 1 = 2</text></g>
    </svg><figcaption>Edge labels are supplied weights. BFS reports an edge count, so its totalCost is 1 even though that edge has weight 10.</figcaption>
  </figure>`;

  const detourFigure = `<figure class="my-6 rounded-[7px] border border-line bg-surface p-[18px]">
    <div class="overflow-x-auto"><svg viewBox="0 0 650 254" class="block w-full min-w-[550px]" role="img" aria-labelledby="detour-title detour-description">
      <title id="detour-title">A cost policy selects a four-step detour</title><desc id="detour-description">In a three by two XZ grid, entering cell one zero zero costs five. The direct route costs six. The route through cells zero zero one, one zero one, and two zero one costs four. X must never decrease.</desc>
      <defs><marker id="detour-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="1.3"><path d="M 74 32 H 572 V 192 H 74 Z M 240 32 V 192 M 406 32 V 192 M 74 112 H 572"/><path d="M 157 85 V 156 H 489 V 85" stroke-width="3" marker-end="url(#detour-arrow)"/><path d="M 172 73 H 471" stroke-dasharray="5 4" marker-end="url(#detour-arrow)"/></g>
      <g fill="currentColor" font-family="sans-serif" text-anchor="middle"><text x="157" y="56" font-size="14">Start · node 0</text><text x="323" y="56" font-size="14">Node 1 · entry cost 5</text><text x="489" y="56" font-size="14">Goal · node 2</text><text x="157" y="139" font-size="14">Node 3</text><text x="323" y="139" font-size="14">Node 4</text><text x="489" y="139" font-size="14">Node 5</text><text x="42" y="79" font-size="13">Z = 0</text><text x="42" y="161" font-size="13">Z = 1</text><text x="157" y="216" font-size="13">X = 0</text><text x="323" y="216" font-size="13">X = 1</text><text x="489" y="216" font-size="13">X = 2</text><text x="323" y="246" font-size="13">Solid: cost 4 · Dashed: cost 6 · X never decreases</text></g>
    </svg></div><figcaption>Top-down XZ view at cell Y = 0. Coordinates label the grid, whose frame is translated by (10, 0, 20) world units. Each allowed edge costs 1, except entering node 1 costs 5.</figcaption>
  </figure>`;

  const quickStartSource = `import nsk.nu.ashcore.api.math.Vector3;
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
            grid.set(x, 0, 0, 1); // Our predicate accepts value 1.
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
        System.out.println("nodes=" + result.path().length()
                + ", cost=" + result.path().totalCost());
    }
}`;

  const weightedSource = `import java.util.Arrays;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import nsk.nu.ashnav.implementation.path.AStarPathfinder;
import nsk.nu.ashnav.implementation.path.BfsPathfinder;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;

public final class WeightedRouteExample {
    public static void main(String[] args) {
        // Node 0 = S, node 1 = A, node 2 = G. Edges are directed.
        WeightedAdjacencyIntGraph graph = new WeightedAdjacencyIntGraph(
                new int[][] { {2, 1}, {2}, {} },
                new double[][] { {10.0, 1.0}, {1.0}, {} }
        );
        print("BFS", new BfsPathfinder(graph).findPath(0, 2));
        print("Dijkstra", new DijkstraPathfinder(graph).findPath(0, 2));
        print("A*", new AStarPathfinder(graph, (node, goal) -> 0.0).findPath(0, 2));
    }

    private static void print(String name, PathSearchResult result) {
        if (result.status() != PathStatus.FOUND) {
            throw new IllegalStateException("Expected a route for " + name);
        }
        System.out.println(name + " nodes=" + Arrays.toString(result.path().nodes())
                + ", cost=" + result.path().totalCost());
    }
}`;

  const controlledSource = `import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.api.path.PathSearchSession;
import nsk.nu.ashnav.api.path.PathSearchState;
import nsk.nu.ashnav.implementation.graph.PolicyWeightedIntGraph;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.IntArrayGrid3i;
import nsk.nu.ashnav.implementation.path.DijkstraPathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class AshnavControlledSearchExample {
    public static void main(String[] args) {
        GridWalkabilityGraph3 nodes = new GridWalkabilityGraph3(
                new IntArrayGrid3i(3, 1, 2), value -> true, GridNeighborhood3.N6
        );
        int expensive = nodes.nodeOfCell(1, 0, 0);
        PolicyWeightedIntGraph graph = new PolicyWeightedIntGraph(nodes,
                (from, to) -> nodes.cellOfNode(to).x() >= nodes.cellOfNode(from).x(),
                (from, to, baseCost) -> to == expensive ? 5.0 : baseCost
        );

        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId vehicle = new FrameId("vehicle");
        frames.define(vehicle, frames.root(), RigidTransform3.translation(10.0, 0.0, 20.0));
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0, Vector3.ZERO, new SquareXZChunkScheme(16)
        );
        FrameMappedGridNavigator3 navigator = new FrameMappedGridNavigator3(
                graph, nodes, mapper, frames, vehicle
        );
        int start = navigator.nodeOfLocalPoint(vehicle, new Vector3(0.5, 0.5, 0.5));
        int goal = navigator.nodeOfWorldPoint(new Vector3(12.5, 0.5, 20.5));
        if (start < 0 || goal < 0) {
            throw new IllegalArgumentException("Endpoint has no node");
        }

        DijkstraPathfinder solver = new DijkstraPathfinder(graph);
        PathSearchSession search = solver.startSearch(start, goal);
        while (search.state() == PathSearchState.IN_PROGRESS) {
            search.advance(2); // The caller can yield between these steps.
        }
        if (search.state() != PathSearchState.FOUND
                || search.result().path().totalCost() != 4.0) {
            throw new IllegalStateException("Expected the cheaper detour");
        }
        System.out.println("detour cost=" + search.result().path().totalCost());

        PathSearchSession cancelled = solver.startSearch(start, goal);
        cancelled.cancel();
        if (cancelled.advance(2) != PathSearchState.CANCELLED) {
            throw new IllegalStateException("Cancellation failed");
        }
    }
}`;

  window.WIKI_PAGES.push(
    {
      id: 'overview', category: 'Getting started', title: 'Ashnav', kind: 'concept', readingTime: 4,
      description: 'Find routes through Java graphs and finite voxel grids, then map the result to your world.',
      intro: `<p>Ashnav is a Java library for pathfinding. You supply places to visit, permitted moves, and their costs. Ashnav searches that model and returns a route as integer node IDs.</p><p>This WIKI documents <strong>Ashnav 2.0.0</strong>. It is for developers building navigation into Minecraft plugins or other Java applications.</p>`,
      sections: [
        { id: 'navigation-model', title: 'From a model to a route', html: `<p>A <strong>node</strong> represents a place. A directed <strong>edge</strong> permits a move from one node to another. A <strong>cost</strong> gives that move a value to minimize, such as travel time or cell steps.</p><p>Build an adjacency graph directly, or project a finite grid with your walkability predicate. Choose a solver and provide start and goal IDs. For positions in a world, add a navigator that maps coordinates to those IDs.</p>${flowFigure}<p>A result describes the graph used by the query. It does not establish whether an entity can still follow that route after the world changes.</p>` },
        { id: 'choose-a-start', title: 'Start with your data', html: cards([
          ['quick-start', 'Find your first route', 'Build a three-cell corridor and search between world positions.'],
          ['graph-model', 'Use an existing graph', 'Describe directed connections with integer node IDs.'],
          ['grid-graphs', 'Project a finite grid', 'Choose accepted cells and a neighbor pattern.'],
          ['minecraft-integration', 'Integrate with a plugin', 'Supply movement rules, scheduling, and world updates.']
        ]) },
        { id: 'library-responsibilities', title: 'What each library supplies', html: `${table(['Library', 'Role in navigation', 'Version used by Ashnav 2.0.0'], [
          ['Ashnav', 'Graph abstractions, pathfinders, sessions, policy views, and navigation bridges.', '2.0.0'],
          ['<a href="https://github.com/Miciasty/Ashcore">Ashcore</a>', 'Shared mathematical types, including <code>Vector3</code>.', '1.2.0'],
          ['Ashgrid', 'Voxel grid and cell-index interfaces, neighborhood offsets, and chunk indexing.', '1.3.0'],
          ['Ashspace', 'World/grid mapping, coordinate frames, and rigid transforms.', '2.0.0']
        ])}<p>Maven resolves the three lower-level libraries as transitive dependencies. Ashnav owns the search model; your application owns the terrain data and the behavior that follows a route.</p>` },
        { id: 'minecraft-scope', title: 'Minecraft integration scope', html: `${note('A Java library', '<p>Ashnav has no server plugin entry point, <code>plugin.yml</code>, player commands, permission nodes, or configuration file. Add it to the plugin you develop. Dropping the Ashnav JAR into a server does not install a navigation feature.</p>')}<p>Ashnav does not scan chunks, move NPCs, schedule work, or simulate collisions. A cell accepted by your predicate only becomes a node. Your plugin must define support, headroom, body clearance, doors, stairs, ladders, jumps, drops, and crowd behavior.</p><p>See <a href="#/minecraft-integration">Minecraft integration</a> for that boundary and <a href="#/policies">Movement policies</a> for restricting directed edges.</p>` },
        { id: 'release-basis', title: 'Version and source', html: `<p>The contracts and examples follow the <a href="https://github.com/Miciasty/Ashnav/tree/v2.0.0">2.0.0 source</a>, its tests, and its dependency declarations. <a href="https://central.sonatype.com/artifact/dev.nasaka.blackframe/ashnav/2.0.0">Maven Central</a> provides the artifact. Ashnav uses the Apache License 2.0.</p><p>Read <a href="#/releases">Release notes</a> before upgrading older code. Version 2.0.0 changes observable A* behavior and validation while retaining existing public signatures.</p>` }
      ]
    },
    {
      id: 'installation', category: 'Getting started', title: 'Install the dependency', kind: 'guide', readingTime: 5,
      description: 'Add Ashnav 2.0.0 to a Java project and check the resolved dependency versions.',
      intro: `<p>Use JDK 21 or newer. Ashnav is available from Maven Central as <code>dev.nasaka.blackframe:ashnav:2.0.0</code>. You do not need a custom Maven repository or a local build of Ashcore.</p>`,
      sections: [
        { id: 'maven', title: 'Maven', html: `<p>Add this dependency inside your existing <code>dependencies</code> element. Keep the default compile scope when you intend to bundle the library.</p>${code(`<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashnav</artifactId>
  <version>2.0.0</version>
</dependency>`, 'xml', 'pom.xml · dependency')}<p>For a standalone example project, use this complete POM. Save example classes under <code>src/main/java</code>.</p>${code(`<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>ashnav-example</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>dev.nasaka.blackframe</groupId>
      <artifactId>ashnav</artifactId>
      <version>2.0.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.13.0</version>
      </plugin>
    </plugins>
  </build>
</project>`, 'xml', 'pom.xml')}` },
        { id: 'gradle', title: 'Gradle Kotlin DSL', html: `<p>Use Maven Central and add Ashnav to <code>implementation</code>. This example selects a Java 21 toolchain.</p>${code(`plugins {
    java
}

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencies {
    implementation("dev.nasaka.blackframe:ashnav:2.0.0")
}`, 'kotlin', 'build.gradle.kts')}` },
        { id: 'dependency-versions', title: 'Check dependency resolution', html: `<p>The published POM declares these versions. If your application also uses other Blackframe libraries, inspect the versions selected by the combined dependency graph.</p>${table(['Artifact', 'Version'], [
          ['<code>dev.nasaka.blackframe:ashcore</code>', '<code>1.2.0</code>'],
          ['<code>dev.nasaka.blackframe:ashgrid</code>', '<code>1.3.0</code>'],
          ['<code>dev.nasaka.blackframe:ashspace</code>', '<code>2.0.0</code>']
        ])}${code('mvn dependency:tree', 'powershell', 'Terminal · Maven project')}<p>Ashspace 2.0.0 is part of the documented coordinate behavior. Forcing older lower-level versions can change boundary results or remove APIs required by other libraries. Resolve conflicts before comparing a route against these examples.</p>` },
        { id: 'source-build', title: 'Build Ashnav from source', html: `<p>Use JDK 21 or newer and Maven 3.9 or newer. Run this command in the Ashnav checkout.</p>${code('mvn -B clean verify', 'powershell', 'Terminal · Ashnav checkout')}<p>The build compiles the library and runs its unit and integration checks. A source build is useful when changing Ashnav; consuming the published dependency does not require it.</p>` },
        { id: 'runtime-packaging', title: 'Provide the library at runtime', html: `<p>A dependency declaration makes classes available during the build. Your deployed application also needs Ashnav and its runtime dependencies. For a Minecraft plugin, see <a href="#/minecraft-integration">Minecraft integration</a> for a Maven Shade example.</p>${cards([['quick-start', 'Run the corridor example', 'Compile a full Java class and inspect its route.'], ['troubleshooting', 'Resolve setup problems', 'Check missing classes, version conflicts, and query errors.']])}` }
      ]
    },
    {
      id: 'quick-start', category: 'Getting started', title: 'Find your first route', kind: 'guide', readingTime: 6,
      description: 'Create a three-cell corridor and find a path between two world positions.',
      intro: `<p>This example runs in a plain Java project with the <a href="#/installation">Ashnav dependency</a>. It needs no Minecraft server. The grid is 3 × 1 × 1 cells, and every cell is accepted by the predicate.</p>`,
      sections: [
        { id: 'corridor-model', title: 'Define the corridor', html: `<p>The grid uses <code>N6</code>, which connects cells that share a face. In this corridor, only X can change. Each edge costs 1 cell unit.</p><p>The mapper places the grid origin at <code>(−4, 8, 16)</code> world units and gives each cell a width of 2 world units. Start and goal are the centers of cells 0 and 2.</p>${corridorFigure}${table(['Input', 'Value', 'Meaning'], [
          ['Dimensions', '<code>(3, 1, 1)</code>', 'Width, height, and depth in cells.'],
          ['Accepted value', '<code>1</code>', 'A choice made by this example’s predicate.'],
          ['Start', '<code>(−3, 9, 17)</code>', 'World point inside cell <code>(0, 0, 0)</code>.'],
          ['Goal', '<code>(1, 9, 17)</code>', 'World point inside cell <code>(2, 0, 0)</code>.'],
          ['Chunk scheme', '<code>SquareXZChunkScheme(16)</code>', 'The mapper’s indexing scheme; it does not load Minecraft chunks.']
        ])}` },
        { id: 'java-example', title: 'Create the Java class', html: `<p>Save the complete class as <code>src/main/java/AshnavQuickStart.java</code>. Dijkstra minimizes the supplied graph costs.</p>${code(quickStartSource, 'java', 'AshnavQuickStart.java')}<p>The same <code>graph</code> instance is passed to the navigator and solver. Built-in solvers expose their graph; the navigator rejects one bound to a different instance.</p>` },
        { id: 'run-example', title: 'Compile and run', html: `<ol class="steps list-none pl-0 [counter-reset:steps]"><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Compile the consumer project</h3><p>Run this command beside your consumer <code>pom.xml</code>. It also copies runtime dependencies for the next command.</p>${code('mvn -B compile dependency:copy-dependencies', 'powershell', 'Terminal · consumer project')}</li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Run the example</h3><p>On Windows, separate classpath entries with a semicolon.</p>${code('java -cp "target/classes;target/dependency/*" AshnavQuickStart', 'powershell', 'Windows · PowerShell')}<p>On Linux or macOS, use a colon.</p>${code('java -cp "target/classes:target/dependency/*" AshnavQuickStart', 'bash', 'Linux/macOS · Bash')}</li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Read the result</h3>${code('nodes=3, cost=2.0', 'output', 'Expected output')}<p>The route has three nodes and two moves. Its cost remains 2 because coordinate mapping does not rescale graph costs.</p></li></ol>` },
        { id: 'change-corridor', title: 'Try a blocked cell', html: `<p>Before constructing <code>GridWalkabilityGraph3</code>, set the middle cell to 0 with <code>grid.set(1, 0, 0, 0)</code>. The start and goal remain valid nodes, but the corridor is disconnected. The query returns <code>UNREACHABLE</code>, and the example’s “Expected an open corridor” check throws.</p><p>Editing the source grid after graph construction has no effect on the existing graph. Rebuild the graph, solver, and navigator to capture the change. Node IDs can change after a rebuild.</p><p>Move the goal to <code>(2, 9, 17)</code> to try the upper X boundary. That point maps to cell X = 3, outside this grid. The navigator returns <code>UNREACHABLE</code> with <code>visitedNodeCount = 0</code> without searching.</p>` },
        { id: 'next-steps', title: 'Choose the next step', html: cards([
          ['examples', 'Compare routes', 'Run a weighted graph and a policy-controlled detour.'],
          ['coordinates', 'Understand world mapping', 'Follow cell bounds, centers, and negative coordinates.'],
          ['sessions', 'Split search work', 'Advance a query with a queue-pop budget.'],
          ['results', 'Handle query results', 'Distinguish found routes, missing endpoints, and disconnected graphs.']
        ]) }
      ]
    },
    {
      id: 'examples', category: 'Guides', title: 'Examples', kind: 'guide', readingTime: 9,
      description: 'Run complete Java examples for weighted routes, movement policies, coordinate frames, and stepped search.',
      intro: `<p>Each class below compiles in the consumer project from <a href="#/installation">Installation</a>. Save it under <code>src/main/java</code>. Use the <a href="#/quick-start">quick start commands</a> and replace the main class name with the example’s name.</p>`,
      sections: [
        { id: 'weighted-routes', title: 'Compare edge count with traversal cost', html: `<p>Three nodes form a directed graph: S is node 0, A is node 1, and G is node 2. The direct edge costs 10. Passing through A costs 1 + 1.</p>${weightedFigure}${code(weightedSource, 'java', 'WeightedRouteExample.java')}${code('BFS nodes=[0, 2], cost=1.0\nDijkstra nodes=[0, 1, 2], cost=2.0\nA* nodes=[0, 1, 2], cost=2.0', 'output', 'Expected output')}<p>BFS minimizes the number of edges and ignores their weights. Dijkstra minimizes the sum of weights. A* uses zero estimates here, a valid lower bound that does not require geometric assumptions.</p><p>The graph has no reverse edges. A search from G to S returns <code>UNREACHABLE</code>. See <a href="#/solvers">Solvers</a> before supplying a nonzero A* heuristic.</p>` },
        { id: 'controlled-detour', title: 'Compose a policy, frame, and session', html: `<p>This example uses a 3 × 1 × 2 grid. A policy permits an edge only when X stays equal or increases. Entering cell <code>(1, 0, 0)</code> costs 5; every other edge costs 1.</p><p>The grid belongs to a frame translated by <code>(10, 0, 20)</code>. The start is given in that frame; the goal is given in world coordinates. Both map to IDs preserved by the policy graph.</p>${detourFigure}${code(controlledSource, 'java', 'AshnavControlledSearchExample.java')}${code('detour cost=4.0', 'output', 'Expected output')}<p>The selected route uses nodes <code>[0, 3, 4, 5, 2]</code>. It costs 4 instead of the direct route’s cost of 6. Returning from goal to start is impossible because it requires decreasing X.</p>` },
        { id: 'example-lifecycle', title: 'Adapt the example to an event loop', html: `<p>The example’s <code>while</code> loop runs to completion. In an application, keep the session between callbacks and call <code>advance(2)</code> when your scheduler assigns work. A budget of 2 means at most two queue removals, including stale entries.</p><p>That budget is not two milliseconds or two visited nodes. A step can process a whole outgoing row. Session creation, callback execution time, and final route construction are outside the queue-pop bound.</p><p>Keep the graph, policies, and captured data stable until the session finishes. Use one thread to advance or cancel each session. The separate cancellation example demonstrates that a cancelled session stays <code>CANCELLED</code> and has no completed path result.</p>${cards([['policies', 'Movement policies', 'Filter directed edges and assign costs without changing node IDs.'], ['sessions', 'Search sessions', 'Handle completion, failure, cancellation, and work counters.'], ['frames', 'Coordinate frames', 'Understand the navigator’s captured transforms.'], ['limits', 'Limits and performance', 'Estimate work and memory for your graph.']])}` }
      ]
    },
    {
      id: 'minecraft-integration', category: 'Guides', title: 'Minecraft integration', kind: 'guide', readingTime: 7,
      description: 'Embed Ashnav in your plugin and define the world, movement, and scheduling behavior around its search API.',
      intro: `<p>Ashnav 2.0.0 provides a Java search library. It contains no Bukkit or Paper adapter and declares no Minecraft server compatibility range. The examples here explain integration responsibilities; they do not represent a tested live-server plugin.</p>`,
      sections: [
        { id: 'bundle-library', title: 'Bundle the runtime classes', html: `<p>Add the dependency from <a href="#/installation">Installation</a> to your plugin project. If your distribution uses a single JAR, shade Ashnav and its transitive runtime dependencies into that JAR. Your plugin supplies its own platform entry point and descriptor.</p><p>For Maven, merge the following plugin into your existing <code>build/plugins</code>. This is a consumer build example; it is not part of Ashnav’s published POM.</p>${code(`<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>3.6.2</version>
  <executions>
    <execution>
      <phase>package</phase>
      <goals>
        <goal>shade</goal>
      </goals>
      <configuration>
        <createDependencyReducedPom>false</createDependencyReducedPom>
        <transformers>
          <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
          <transformer implementation="org.apache.maven.plugins.shade.resource.ApacheLicenseResourceTransformer"/>
          <transformer implementation="org.apache.maven.plugins.shade.resource.ApacheNoticeResourceTransformer"/>
        </transformers>
      </configuration>
    </execution>
  </executions>
</plugin>`, 'xml', 'pom.xml · build/plugins')}<p>Shade runs during <code>package</code> and bundles eligible dependencies. Keep your server API in the scope required by your platform instead of packaging server classes. The <a href="https://maven.apache.org/plugins/maven-shade-plugin/examples/includes-excludes.html">Apache Shade guide</a> explains dependency selection. The <a href="https://maven.apache.org/plugins/maven-shade-plugin/examples/resource-transformers.html">resource transformer reference</a> describes service, license, and notice handling.</p><p>Inspect the final JAR and resolved dependency tree before deployment. If you relocate library packages for isolation, apply one consistent relocation strategy across the Blackframe libraries and your references to them.</p>` },
        { id: 'model-movement', title: 'Define valid movement', html: `${table(['Your plugin supplies', 'Ashnav uses it as'], [
          ['A finite captured region or an explicit set of navigation locations.', 'Grid cells or integer graph nodes.'],
          ['A rule for accepting a cell.', 'The <code>GridWalkabilityGraph3</code> predicate.'],
          ['Checks for support, headroom, clearance, and allowed movement direction.', 'Directed edges or an <code>IntEdgePredicate</code>.'],
          ['A cost model for permitted moves.', 'Finite, non-negative edge costs for Dijkstra or A*.'],
          ['Conversion from your world positions to <code>Vector3</code>.', 'World-point input for a navigator.'],
          ['Entity control and a response to terrain changes.', 'Application behavior after a route is found.']
        ])}${note('Endpoint walkability is only one condition', '<p><code>N18</code> and <code>N26</code> connect diagonal endpoints even if intermediate side cells are blocked. <code>N6</code> removes those diagonal moves, but still does not validate body clearance or support. Add movement checks through a policy or your own graph.</p>')}<p>The <a href="#/examples">controlled detour example</a> shows how an edge policy changes a route while preserving the grid mapping. That policy is an illustrative restriction, not a complete Minecraft movement model.</p>` },
        { id: 'snapshot-lifecycle', title: 'Capture and replace a navigation model', html: `<ol class="steps list-none pl-0 [counter-reset:steps]"><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Capture the required world data</h3><p>Read terrain in the execution context allowed by your server platform. Store the finite data needed by your predicate and movement policy.</p></li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Construct a stable graph</h3><p>Keep the grid and predicate unchanged during construction. <code>GridWalkabilityGraph3</code> then retains its own fixed cell/node mapping.</p></li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Search the captured model</h3><p>Bind the solver to the same traversal graph as the navigator. Retain stable policy data through the entire query, including pauses between session steps.</p></li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Validate and apply the route</h3><p>Map IDs through the original mapping. Check that the route still fits the current world before your plugin starts or continues movement.</p></li><li class="relative m-0 pb-[25px] pl-[43px] max-[680px]:pl-[37px]"><h3>Replace changed models together</h3><p>Rebuild the graph, solver, and navigator when your captured region changes. Associate results with the model that produced them; rebuilt node IDs can mean different cells.</p></li></ol><p>The <a href="#/grid-graphs">grid snapshot</a> captures accepted cells. A <a href="#/policies">policy view</a> retains callbacks and their referenced data. A <a href="#/frames">frame navigator</a> captures transforms. These three lifetimes must agree with your query.</p>` },
        { id: 'schedule-search', title: 'Choose when search work runs', html: `<p>Blocking <code>findPath</code> runs until completion. Use <code>startSearch</code> and a <a href="#/sessions">search session</a> when your plugin needs to divide work across scheduled callbacks.</p><p>Schedule work using your platform’s API. Ashnav supplies neither a scheduler nor an asynchronous wrapper. A session is thread-confined; its queue-pop budget does not limit elapsed time or heap use.</p><p>Independent queries can share a solver only when the graph is safe to share and callbacks are thread-safe. This property does not make world APIs or mutable grids safe to access from another thread.</p>` },
        { id: 'integration-checks', title: 'Check your integration', html: `<p>First run the <a href="#/quick-start">plain Java corridor</a> to confirm dependency resolution. Then test your plugin’s own captured region, movement rules, cancellation path, and response to changed terrain.</p><p>Include missing endpoints, disconnected valid cells, diagonal clearance, and a route that becomes invalid before movement completes. These checks validate your adapter and world model. Ashnav’s graph and integration tests do not establish live-server compatibility for your plugin.</p>` }
      ]
    }
  );
})();
