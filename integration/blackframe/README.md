# Ashnav cross-library integration

This separate test project exercises packaged Ashnav, Ashtrace, Ashspace, Ashgrid and Ashcore together.
It declares only Ashnav and Ashtrace, with Ashnav first, and JUnit in test scope. Lower libraries are
resolved transitively. This ordering caught Ashnav selecting obsolete lower-layer dependencies before
the dependency correction. Ashtrace is not a production dependency of Ashnav.

## Run from local sources

Use JDK 21, Maven 3.9.9 and PowerShell 7. Place the Ashcore, Ashgrid, Ashspace and Ashtrace checkouts
beside Ashnav, or pass their containing directory with `-LibrariesDirectory`. From Ashnav:

```powershell
./scripts/verify-blackframe.ps1
```

For an existing offline toolchain/cache, executable and settings paths can be supplied:

```powershell
./scripts/verify-blackframe.ps1 -Maven /path/to/mvn -JavaHome /path/to/jdk21 -Settings /path/to/settings.xml -Offline
```

The script copies source trees, tests, POMs, README and notices into a new directory under
`Ashnav/.verification/cross-library-<timestamp>`. It builds each lower library in dependency order using
`clean verify` and local `install`, then verifies and installs Ashnav using its unchanged declared POM.
Lower copied POMs select the freshly built development versions; currently only Ashgrid's Ashcore
property needs adjustment. A mismatched Ashnav POM fails instead of being silently rewritten.
The sources must use snapshot coordinates. Sibling working trees and the normal Maven repository are
not written. All dependency installation uses `Ashnav/.verification/repository`.

The final step runs this consumer's `clean verify` and dependency tree against those installed JARs.
It fails on missing tests or a failing assertion. `-SkipConsumer` only provisions/verifies the libraries;
it does not count as completion of the combined integration. After provisioning, the consumer can also
be run separately with the same Maven repository and settings:

```text
mvn -B -f integration/blackframe/pom.xml -Dmaven.repo.local=<absolute-Ashnav-path>/.verification/repository clean verify
```

No deploy, push or publication is performed. Logs, test XML, source commits/status and main-JAR hashes
identify each run. `.verification/cross-library-run.txt` contains its directory. An offline run needs
all plugins and dependencies cached under repository IDs enabled by the supplied settings.

## Scenarios

| Boundary | Checks |
| --- | --- |
| Ashgrid storage → Ashnav graph | Dense arrays, bit storage, sparse and chunked windows with negative source offsets; eight seeded maps, N6/N18/N26, graph IDs/edge order/costs and all node pairs |
| Ashgrid connectivity → Ashnav reachability | Components loaded through Ashcore service discovery provide a separate connectivity oracle; BFS reachability and weighted Dijkstra/stepped A* agree |
| Mutable grid → captured navigation | Edits after a session starts leave the captured path intact; a rebuilt graph reflects the blockage; stepped component labeling feeds a navigation region |
| Ashspace → Ashnav mapping | Nested rotated frames, translations, three cell sizes, center round trips away from faces, captured transforms after frame removal and relative coordinates at a 2^54 world origin |
| Numeric boundaries | A negative subnormal coordinate stays outside cell 0; Ashtrace explicitly rejects a ray whose cell-space offset underflows, while Ashspace preserves floor membership |
| Ashtrace → movement policy | Linear, static BVH, dynamic BVH and spatial hash sweeps produce the same body-clearance detour, with nonunit world distances and a rotated grid |
| Dynamic index → next query | Removing an obstacle after the previous search completes shortens the next route; prior immutable results remain unchanged |
| Fine voxel trace → coarse navigation | Half-size voxel occlusion filters coarse-grid edges through a caller policy; the resulting detour's segments are clear |
| Packaged boundary | All five libraries load from JARs; the DDA and component services resolve from their packaged resources |

These tests use box obstacles as the exact geometry of their fixture. General broad-phase bounds remain
candidates, and a point segment does not establish body clearance. Policy inputs must stay stable during
the entire search/session. Frame/grid/index snapshots are selected explicitly for each scenario.

## CI and release scope

The Java CI workflow checks out the four tested sibling commits and runs the same script. Those commits
must be reachable in the configured GitHub repositories; local verification does not establish remote
availability or a successful GitHub Actions run. Updating a pinned commit requires repeating integration.
The tested versions are development snapshots. Before release, select and verify published lower-layer
versions, update the POM and integration configuration, and run the separate release gate.

Actual versions, source identities, failures and final results are recorded in
[VERIFICATION.md](../../VERIFICATION.md#cross-library-integration).
