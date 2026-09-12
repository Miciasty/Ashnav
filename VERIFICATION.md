# Ashnav verification and release record

`integration/` and `scripts/` are local tools excluded from Git. The procedures below that use them
require an existing local copy. CI verifies and installs Ashcore, Ashgrid and Ashspace from their
release tags, then runs Ashnav's `clean verify`, including packaged-artifact tests. The separate
combined consumer is no longer run in CI. Earlier CI descriptions below are historical records.

The latest record is [Release versions and dependency alignment](#release-version-alignment).
Earlier records retain the versions, test counts and hashes of their historical builds.

<a id="release-version-alignment"></a>

## 2026-09-10 — Release versions and dependency alignment

The user selected release coordinates without the SNAPSHOT suffix. The five library POMs and their
Blackframe dependencies now agree: Ashcore **1.2.0**, Ashgrid **1.3.0**, Ashspace **2.0.0**,
Ashtrace **2.0.0** and Ashnav **2.0.0**. Ashnav's former Core 1.1 dependency and Ashgrid's former
Core 1.0.1 default both become Core 1.2.0. No production Java implementation or API was changed.
The standalone consumer uses test-project version 0.0.0. Ashtemplate remains a scaffold for new projects.

`verify-blackframe.ps1` now accepts release coordinates and rejects mismatched dependencies in every
library. It never rewrites copied POMs. `-SkipGitMetadata` omits all Git calls; SHA-256 records of the
copied source files still identify the inputs. The new consumer test
`navFirstConsumerResolvesOrientedGeometryThroughSpaceAndTrace` exercises OBB conversion and exact
ray intervals through the transitive dependencies, with Ashnav declared before Ashtrace.

### Executed verification

Windows, Eclipse Adoptium JDK **21.0.12.1+1**, Maven **3.9.16**, compiler release **21**.
All five current source trees were copied and built in dependency order with `clean verify` and
local `install`, offline in `Ashnav/.verification/repository`. The combined consumer then ran
`clean verify` and `maven-dependency-plugin:3.8.1:tree` against those installed JARs.

| Project | Version | Unit/integration tests | Packaged-artifact tests |
| --- | --- | --- | --- |
| Ashcore | 1.2.0 | 165 PASS | 3 PASS |
| Ashgrid | 1.3.0 | 102 PASS | 4 PASS |
| Ashspace | 2.0.0 | 87 PASS | 2 PASS |
| Ashtrace | 2.0.0 | 104 PASS | 2 PASS |
| Ashnav | 2.0.0 | 62 PASS | 2 PASS |
| Combined consumer | 0.0.0 | 12 PASS | — |

Total: **545 tests**, zero failures, errors or skips. The last gate finished
**2026-09-10 16:51:45 +02:00**, exit 0. README examples and main/sources/Javadoc JAR checks are included
in the library gates. The consumer dependency tree resolves exactly Core 1.2.0, Grid 1.3.0,
Space 2.0.0, Trace 2.0.0 and Nav 2.0.0. No dependency-version override was passed.
PowerShell parsing and actionlint 1.7.7 for the changed Java CI workflow passed.
This release set was not rerun on Java 25; earlier snapshot results below are separate evidence.

Local evidence: `.verification/cross-library-20260910-165049/` contains six build logs,
test XML, `source-files.jsonl` and `artifact-hashes.jsonl`. The verified main/sources/Javadoc
JARs were also copied to each library's `target` directory under their release filenames.
Those root target directories can still contain older snapshot build outputs; the isolated run
above is the authoritative test record for this release set.

| Main JAR | SHA-256 |
| --- | --- |
| ashcore-1.2.0.jar | `f53cbc5f73d873e940cf0260a95d37123268116633896d8381e47b541da28ed9` |
| ashgrid-1.3.0.jar | `5c206e4536ba3221cdbdd5eb763377af410948741127cff1eef61f56a188059b` |
| ashspace-2.0.0.jar | `99af6bf47dc726b8c17db2810f4b3f6b45a857a935b972f290bb1fc4fd4f8f91` |
| ashtrace-2.0.0.jar | `dd445639e68605d655efc56d5495879565a45c69bf22a8d236ac728ecf695c10` |
| ashnav-2.0.0.jar | `3ba2b456ceaa0760e7161cc5daa17649392c56967ae86e4104e50d0bdaed6ad9` |

Ashtrace's `scripts/development-dependencies.json` retains its filename for compatibility but now
identifies release JARs and POMs. Historical commit values are labelled `sourceBaselineCommit`;
they do not claim to include this working-tree version promotion.

Reproduce from Ashnav with the appropriate local tool paths:

```powershell
./scripts/verify-blackframe.ps1 -Maven /path/to/mvn -JavaHome /path/to/jdk21 -Settings /path/to/settings.xml -Offline -SkipGitMetadata
```

The successful run used Ashtrace's existing local-cache settings. The first attempt could not launch
Maven under the tool sandbox; a second attempt with empty settings failed offline because cached
plugins belonged to repository ID `existing-cache`. Neither ran tests. Selecting the matching cached
repository settings resolved this. Maven then ran with execution escalation; all writes remained
inside Blackframe and the user Maven cache was only a read source.

### Publication status

The source and local artifacts use release versions. No Git command, branch, commit, tag, push,
deployment or publication was performed. Historical snapshot verification is preserved below.
Ashnav CI now selects sibling release tags v1.2.0 (Core), v1.3.0 (Grid) and v2.0.0 (Space/Trace).
Those tags must be created and available before hosted integration can run; this session did not
check their remote existence. Publishing consumers requires their release dependencies to be
available from the configured Maven repositories. Remote CI and publication remain separate checks.

## 2026-09-10 — Blackframe revision 2.0 corrections

Development coordinates: `dev.nasaka.blackframe:ashnav:2.0.0-SNAPSHOT`.
All NAV-001 through NAV-008 acceptance checks are covered locally. Publication and remote CI execution
remain unverified; this record is not evidence of a release.

Work is confined to Ashnav. Branch: `fix/ashnav-contract-20260910`.
Checkpoint `5dd3d84` records the original code and previously untracked ISSUES.md before corrections;
the earlier implementation baseline was `08e7d26`. The correction commit is the commit introducing
this record. No sibling source, POM, branch or working tree was changed.

## Environment and reproducible commands

- Windows 11 amd64, locale pl_PL, UTF-8.
- Eclipse Adoptium JDK **21.0.12.1+1**.
- Apache Maven **3.9.9**, revision `8e8579a9e76f7d015ee5ec7bfcdc97d260186937`.
- actionlint **1.7.7**, optional ShellCheck and Pyflakes integrations disabled.

The default PATH exposed Java 8 and no Maven. Existing JDK/Maven/actionlint binaries under
`../Ashspace/.verification/` were used without changing them. All new settings, caches, copies and logs
are inside ignored `Ashnav/.verification/`; the user's normal Maven repository was not written.
The new Maven cache started empty and resolved production dependencies from Maven Central.

The final gate completed **2026-09-10 10:10:22 +02:00**, exit **0**, with all required tests enabled:

```powershell
$env:JAVA_HOME = (Resolve-Path '../Ashspace/.verification/jdk/jdk-21.0.12.1+1').Path
& '../Ashspace/.verification/apache-maven-3.9.9/bin/mvn.cmd' -B -ntp -o `
    -s .verification/settings.xml '-Dmaven.repo.local=.verification/repository' clean verify
```

The settings file contains only an empty Maven settings element. Initial online runs omitted `-o`.
The portable equivalent on a configured JDK/Maven installation is `mvn -B clean verify`.
Verification does not activate `central`, sign, deploy or upload artifacts.

Additional successful checks:

```text
mvn -B -ntp -s .verification/settings.xml -Dmaven.repo.local=.verification/repository clean verify dependency:tree -DoutputFile=.verification/dependency-tree.txt help:effective-pom -Doutput=.verification/effective-pom.xml
../Ashspace/.verification/actionlint/actionlint.exe -shellcheck= -pyflakes= .github/workflows/maven.yml .github/workflows/publish.yml
git -c safe.directory=G:/Github/Blackframe/Ashnav -c core.autocrlf=false diff --check
git -c safe.directory=G:/Github/Blackframe/Ashnav ls-remote --symref origin HEAD
```

The remote query returned `refs/heads/master`, HEAD `cc30b65746d1829a771b8524918ea8e59fa3201b`.
CI covers every branch push and every pull request, including the correction branch.

Compiler `3.13.0` uses `release=21`, consistent with the [Maven release option](https://maven.apache.org/plugins/maven-compiler-plugin/examples/set-compiler-release.html).
Surefire and Failsafe are pinned at `3.2.5`. Packaged checks run after packaging and are enforced at
`verify` using the [Failsafe lifecycle](https://maven.apache.org/surefire/maven-failsafe-plugin/).
Javadoc `3.7.0` uses `doclint=all,-missing`, `failOnError=true`: missing tags are not a blocking style rule,
but documentation errors fail the build. Core lifecycle, packaging and reporting plugins are pinned.

## Tests and decisions

| Check | Actual result |
| --- | --- |
| Original suite before source corrections | 29 tests PASS |
| New regressions on original implementation | 32 tests; 2 failures, reproducing A* cost 5 instead of 4 and acceptance of a 2^64-cell grid |
| Corrected suite | 45 tests PASS, 0 failures/errors/skipped |
| Final clean verify | 45 tests + 2 packaged-artifact tests PASS, 0 failures/errors/skipped |
| Same suite with identified current sibling snapshots | 45 + 2 PASS |
| Workflow validation | Both files pass actionlint |
| Legacy API comparison and consumer example | No removed public member signatures; old compiled example runs with new JAR and prints 3 |

| Issue | Evidence and final policy |
| --- | --- |
| NAV-001 | `AStarReopeningTest` reproduces and fixes an admissible inconsistent heuristic. A separate overestimate test documents the unsupported optimality case. `PathfinderContractsTest` compares Dijkstra and A* with Floyd–Warshall on 80 seeded small graphs, all start/goal pairs, including disconnected graphs, zero costs and self-loops. It checks costs, valid acyclic routes and repeatability separately. A* reopens only on strict improvement, retains the first equal-cost parent and requires h(goal)=0. It does not claim to validate admissibility. |
| NAV-002 | Grid tests demonstrate diagonal movement between blocked side cells and snapshot independence after source edits. BFS chooses a one-edge route of supplied cost 10 and reports 1; weighted solvers choose two edges costing 2. README explains support, headroom, clearance and custom connectivity. |
| NAV-003 | Built-in solvers expose graph identity through the new `GraphPathfinder`. The navigator rejects another graph even with the same node count and accepts the legacy functional interface under an explicit shared-model precondition. Integration covers shifted origin, cellSize=2, exact/adjacent-double boundaries, blocked/outside endpoints, disconnected nodes, null/NaN inputs and unchanged cost units. |
| NAV-004 | `GridDimensions` checks positive dimensions and safely bounds the two-axis product by `Integer.MAX_VALUE / depth` before multiplying the third axis. Both storage and custom-grid projection reject oversize input before allocation or cell reads. `IntArrayGrid3i` remains a supported compatibility helper; Ashgrid `ArrayGrid3i` owns general storage functionality. |
| NAV-005 | README/Javadoc account for linear edge lookup, sum of squared row lengths, all queue states, repeated A* expansions, callback work and output copies. The hub example is a comparison count inferred from the loop, not a benchmark. No performance optimization or latency claim was made. |
| NAV-006 | Tests cover duplicate costs in both orders, copied rows, zero costs/self-loops, route ties, input-order effects and sum/priority overflow. Repeated neighbor IDs preserve first-entry cost semantics and iteration order. README limits determinism to stated inputs, versions and environment. |
| NAV-007 | All original public constructors and types remain. The complete README example compiles with release 21 against packaged dependencies and executes through an isolated class loader. Source/binary signature checks and the legacy example supplement this evidence. Behavior changes are reserved for 2.0.0-SNAPSHOT and documented in README migration notes. |
| NAV-008 | Clean verify, dependency tree, effective POM, strict Javadoc errors, exact artifact checks, Java class version checks and actionlint pass. Publishing routes and unverified remote state are recorded below. |

Optimality preconditions follow the admissibility/consistency distinction explained in the
[CS188 search notes](https://inst.eecs.berkeley.edu/~cs188/fa22/assets/notes/cs188-fa22-note02.pdf).
README also explains the limits of rounded double sums; no mathematical error bound is claimed.

## Exact dependency artifacts

The default POM deliberately retains its release dependencies. `_remote.repositories` files record
`central` for these fresh downloads; they were not taken from sibling source trees or substituted by
locally installed releases. Dependency tree and effective POM confirm JUnit and all its transitive
dependencies are test-scoped. There are no other production dependencies.

| Dependency | Scope | SHA-256 of JAR |
| --- | --- | --- |
| Ashcore 1.0.1 | compile | `0ea3a990d28a01aac97c574497c21be2f2ced5b90eaa03637c8499cbf1d62d0b` |
| Ashgrid 1.2.0 | compile | `b0ea0b634f77504747142b1e3475676c3ab40fea92c5f76075d47bb2d5d24ef7` |
| Ashspace 1.0.0 | compile | `deeeeef9808052140508f26faf0a2b3a8c1ac16ba9bab9ba9428809c4190a03f` |
| JUnit Jupiter 5.10.2 | test | API, params, engine and their transitives remain test-only |

The additional integration used an Ashnav source/test/POM/README copy under `.verification/updated-layers`.
Only dependency versions in that copied POM changed. Existing sibling snapshot JAR/POM pairs were installed
into Ashnav's isolated repository with `maven-install-plugin:3.1.3:install-file`; original sibling repositories
were not built or installed in place. Their source JAR contents were compared with the clean checkouts,
normalizing line endings, and every Java source entry matched. The tested binaries are identified by hash:

| Sibling commit | Dependency | SHA-256 of tested JAR |
| --- | --- | --- |
| Ashcore `e519440` | 1.1.0-SNAPSHOT | `9b7758dee82a8fa7338afcc7b7bf22fe02682aaff670c10dd4971be9390c845f` |
| Ashgrid `8199f9b` | 1.3.0-SNAPSHOT | `b4a8d0ac87ebe34132f1f86d8870e8f32f5f270b95d263a0fc21e345a6e71285` |
| Ashspace `f652173` | 2.0.0-SNAPSHOT | `7f0e82346ee9c880a42e68eb24902439af7e9aba5ad7222b39930d9ab3cb0e94` |

The snapshot run finished at **10:07:04 +02:00**, exit 0. Its dependency tree confirms all three selected
versions, and the complete quick start still prints `nodes=3, cost=2.0`. Its source differs from the final
gate only in import ordering. This verifies Ashnav's boundary behavior with those binaries; it is not
a fresh full audit of the lower libraries or evidence that their snapshots are published.

## Compatibility and generated artifacts

The comparison baseline was the existing local `ashnav-1.0.0.jar`, copied into `.verification/` without
modifying its origin. SHA-256: `18b44b415a727ac748445ec25b436c463e56ee1a752ada6a5d29883fa8ac760e`.
`javap -public` on every original public top-level type found no removed method, constructor or field
signatures. The original quick-start code from checkpoint `5dd3d84` was compiled against that baseline
and run with the new Ashnav JAR plus the freshly resolved release dependencies. It printed `3`.
These checks do not claim that every possible consumer or reflection-based assumption was tested.

The final build checks all 17 supported public types in the main, source and Javadoc JARs, plus class
version **65**, matching Maven coordinates, LICENSE and NOTICE. No JUnit classes or SPI registrations
are bundled. Ashnav has no SPI providers; artificial provider tests were not added.

| Final file in target/ | SHA-256 |
| --- | --- |
| ashnav-2.0.0-SNAPSHOT.jar | `9c98db2037a31103b27d4f9b35be6b43d1c43d99267f88e7070bf4903022d146` |
| ashnav-2.0.0-SNAPSHOT-sources.jar | `f5dbbaeea6d81f11bf9ff225d6297db730c08396c91511cb482caf592fa9d475` |
| ashnav-2.0.0-SNAPSHOT-javadoc.jar | `54ce0338eabf596b94ba3e5289f4af59b701bd336a5aee810f67e97aaf79bd03` |

A fixed output timestamp is configured. Bitwise reproducibility across build environments was not tested.
Verification/CI identify artifacts by the exact Maven final name, not by selecting an arbitrary JAR.

## Publishing routes and remaining release work

| Destination | Configured route | State of this correction |
| --- | --- | --- |
| GitHub Packages | `publish.yml`, `distributionManagement` server ID `github`, matching `v<version>` tag and non-snapshot version; clean verify precedes deploy | Configured and workflow linted; not executed. Future release availability and credentials unverified. |
| GitHub Release | A published release triggers package workflow; automatic JAR attachment to the release itself is intentionally not configured. CI uploads the three verified artifacts to GitHub Actions. | No tag or release was created; no artifacts uploaded. |
| Maven Central | Existing manual `central` profile, GPG signing and Sonatype Central plugin/server ID `central`; no Central GitHub workflow | Profile retained, deployment and credentials unverified. No publication claim. |

For a future release, first select the intended dependency versions, choose a new non-snapshot version,
run clean verify on its commit and verify all three exact artifacts, then create a matching `v<version>` tag.
The GitHub workflow rejects branch-based manual publication and snapshot versions. Existing versions
must not be reused for changed contents.

GitHub Packages deployment uses `mvn -B deploy` in the release workflow. The separate manual Central route
uses `mvn -B -Pcentral deploy` with Central credentials and GPG configured outside the repository; it activates
automatic publication and must not be run as a verification command. Check the target configuration and
record destination availability, tag/commit and date after an authorized release. No deploy command was run here.

## Failed attempts and evidence locations

- Running from the workspace parent found no Git repository; Ashnav is its own repository. Git ownership
  was handled with per-command safe.directory, without changing global Git configuration.
- Default Java 8/no Maven and denied access to the installed IDE Maven were resolved by the existing
  local JDK 21/Maven tools. Initial Maven network access was denied by the sandbox; an approved online run
  populated the isolated cache. No credentials were read or changed.
- The first offline snapshot install lacked a Maven plugin dependency. An online retry downloaded it;
  the subsequent snapshot integration passed.
- The first legacy JAR check encountered Java AccessDeniedException resolving the user's cache path.
  That attempt was not accepted as evidence. Copying the JAR into Ashnav and rerunning produced a clean
  signature comparison and successful consumer execution.
- Whitespace found by diff checking in workflow/document edits was corrected; the final diff check passed.

Logs and scripts remain locally under `.verification/`: `baseline.log`, `regressions-before.log`,
`regressions-after.log`, `verify-first.log`, `verify-final.log`, `dependency-tree.txt`, `effective-pom.xml`,
`verify-updated-layers.ps1`, `updated-layers.log`, `verify-compatibility.ps1` and `compatibility.log`.
JUnit XML reports are in `target/surefire-reports` and `target/failsafe-reports`.
Remote CI, publication, performance benchmarks and cross-platform repeatability were not executed.

<a id="navigation-extensions"></a>

## 2026-09-10 — Navigation extensions

The user authorized the four additions identified after the initial corrections: controlled search,
composable movement/cost policies, efficient weighted-edge iteration and local coordinate-frame mapping.
NAV-009 through NAV-012 are complete within Ashnav. The new branch is
`feat/ashnav-controlled-search-20260910`; checkpoint `7d3f046` records the clean state before implementation,
following correction commit `9226c42`. No sibling files, branches or commits changed.

Coordinates remain `dev.nasaka.blackframe:ashnav:2.0.0-SNAPSHOT`. This adds APIs to the same unpublished
development version. The POM, production dependencies, workflows and publishing configuration are unchanged.
The environment and offline `clean verify` command above were reused. All new builds, copied projects,
compatibility probes and measurements stayed under Ashnav; existing sibling tool binaries were read only.

### Accepted contracts

| Issue | Implementation and boundaries |
| --- | --- |
| NAV-009 | All three solvers implement `ResumablePathfinder`; blocking calls drain the same session engine. `advance` budgets queue removals including stale entries. Pausing leaves IN_PROGRESS; cancel between calls produces CANCELLED; callback failure is rethrown and leaves FAILED. Only FOUND/UNREACHABLE have a result. Sessions are confined to one thread, reject reentrant mutation and require stable graph/policy/heuristic data across pauses. An outgoing row is atomic; O(V) initialization, callbacks and final path reconstruction are not a wall-clock or memory budget. Working storage remains until the caller releases the session. Existing path statuses, tie rules and distinct visited-node counts remain. |
| NAV-010 | `PolicyWeightedIntGraph` filters directed edges and maps finite nonnegative costs, preserving IDs, iteration order and duplicate semantics. `GridNodeMapping3` separates node/cell correspondence from connectivity. Both navigators can bind a policy graph and separate mapping. Matching counts are checked; matching ID meanings are the caller's contract. BFS avoids cost policies. Policy data is retained as a live view and must remain stable during a query/session. |
| NAV-011 | `WeightedIntGraph.forEachEdge` has a compatible default. Native adjacency/grid implementations emit node/cost pairs directly; weighted solvers use them. Adjacency construction validates every original cost before normalizing duplicate costs to the first entry, preserving emissions and order. Native row iteration is O(d); standalone `edgeCost` stays linear and custom defaults retain their lookup cost. [BENCHMARKS.md](BENCHMARKS.md) records the measured blocking-call comparison and the initial regression that prompted lower allocation overhead. |
| NAV-012 | `FrameMappedGridNavigator3` uses Ashspace to capture transforms for all defined frames at construction. Points and cell centers can use local or world frames, and endpoints can use different frames. Origin/cell size belong to the grid frame; costs keep their units. Later frame edits/removals do not affect the captured view; new IDs require a new navigator. Capture requires stable frames and takes O(F*h) time/O(F) retained memory. Numeric guarantees remain those of the selected Ashspace version. |

### Verification results

| Check | Actual result |
| --- | --- |
| Full default dependency suite | 61 behavior tests + 2 packaged-artifact tests PASS, 0 failures/errors/skipped |
| Identified sibling snapshots | Same 61 + 2 PASS; completed 2026-09-10 11:18:23 +02:00, exit 0 |
| README examples | Both complete Java examples compile with release 21 against packaged JARs and execute in isolated class loaders; output `nodes=3, cost=2.0` and `detour cost=4.0` |
| Artifacts | All 26 supported public types present in main/source/Javadoc JARs; metadata, notices, class version 65 and absence of bundled JUnit/SPI checked |
| API comparison | `javap -public` for all 17 baseline public types found 0 removed public member signatures |
| Previously compiled custom graph | An implementation of the old `WeightedIntGraph` was compiled against the baseline JAR, then run unchanged with the new JAR; Dijkstra uses the inherited default method and returns cost 2.0 |
| Performance comparison | Three fresh JVM runs per version, three fixtures and two solvers; final measured medians have lower time and allocation for all six combinations. Limits and reproduction are in BENCHMARKS.md. |

`PathSearchSessionTest` covers cancellation, failed callbacks, stale entries, reopening, exact counters,
zero/negative budgets, terminal states, independent sessions, reentrancy and whole-row processing.
`PathfinderContractsTest` additionally compares each budgeted result with its blocking result for all
start/goal pairs in the existing 80 seeded graphs, alongside the Floyd–Warshall cost oracle.
`WeightedEdgeIterationTest` checks duplicate order/first cost, invalid later duplicate values, all grid
neighborhoods, the legacy default and solvers consuming paired edges. `PolicyGraphIntegrationTest` covers
weighted detours, directed restrictions, caller-defined diagonal blocking, independent mappings and
cost-callback behavior. `FrameMappedGridNavigator3IntegrationTest` covers rotation, translation,
nonunit cells, distinct endpoint frames, boundaries, invalid coordinates and captured-frame refresh.

The snapshot check used `.verification/extensions-layers`, a copy of Ashnav sources, tests, POM and README.
Only that copied POM selected Ashcore 1.1.0-SNAPSHOT, Ashgrid 1.3.0-SNAPSHOT and Ashspace 2.0.0-SNAPSHOT.
Its dependency tree confirms those versions and test-only JUnit. The exact cached release/snapshot JAR
hashes are the ones in the earlier [dependency table](#exact-dependency-artifacts); sibling checkouts
remain clean at `e519440`, `8199f9b` and `f652173`, respectively. No lower library was rebuilt or modified.

The compatibility and benchmark baseline is the prior corrected Ashnav JAR, SHA-256
`9c98db2037a31103b27d4f9b35be6b43d1c43d99267f88e7070bf4903022d146`, retained as
`.verification/ashnav-before-extensions.jar`. These checks support the documented compatibility;
they do not establish every possible consumer's behavior or reflection assumptions.

Logs/scripts: `.verification/extensions-verify-first.log`, `extensions-verify-final.log`,
`verify-extensions-layers.ps1`, `extensions-layers.log`, `check-extension-api.ps1`,
`extensions-api.log`, `LegacyWeightedConsumer.java`, `run-benchmark.ps1`, `benchmark-initial.csv`
and `benchmark.csv`. The first complete gate passed at 11:15:03 +02:00. After that gate and the snapshot
check, remaining changes affected constructor whitespace, line endings and the issue/verification records.
The final default gate below verifies the packaged final source tree. The recorded benchmark precedes
documentation/test/formatting edits; the measured algorithms are unchanged.

No online resolution, dependency addition, publication, tag, push or remote CI run was performed for
these extensions. Cross-platform reproducibility and strict wall-clock scheduling were not tested.

The final default `clean verify` completed **2026-09-10 11:24:11 +02:00**, exit **0**, with
**61 + 2 tests passed**, no failures/errors/skips. These are the resulting artifacts:

| Final file in target/ | SHA-256 |
| --- | --- |
| ashnav-2.0.0-SNAPSHOT.jar | `0fefb479dce232418b10fa013ba1b90b26d00f7b518880588f10a334fccd5ee2` |
| ashnav-2.0.0-SNAPSHOT-sources.jar | `56f3c990798f056da1dc1d1a75e6f6cc3b457cf92d3d0faf19d8590f94e9e216` |
| ashnav-2.0.0-SNAPSHOT-javadoc.jar | `6ee815643d5fbd254ecb09a7207a0937b03f28c9dd0f6786a1834fe4d856530e` |

<a id="cross-library-integration"></a>

## 2026-09-10 — Cross-library integration and dependency correction

Work started on `test/ashnav-cross-library-20260910` with checkpoint `ea0c529`, preserving extension
commit `8f59c9d`. The user authorized integration with the remaining libraries and correction of critical
defects, including lower-layer defects. Source/POM/test/workflow changes stayed within Ashnav. No sibling
working tree, branch or commit changed. Ashmesh has no local implementation; Ashtemplate is repository
tooling and is not an executable spatial dependency.

The same Windows/JDK 21.0.12.1+1/Maven 3.9.9 environment was used. Unlike the earlier integration against
existing sibling JARs, this run built fresh source copies of all four lower libraries, tested their
packaged artifacts/examples and installed them only into Ashnav's isolated repository. Copied lower
POMs select the tested development stack; only Ashgrid needs its Ashcore property changed from 1.0.1 to
1.1.0-SNAPSHOT. Its source tree is unchanged. Final Ashnav is built with its declared POM unchanged.

### Reproduced failures and correction

The initial complete builds passed separately: Ashcore 144 + 3, Ashgrid 102 + 4, Ashspace 74 + 2,
Ashtrace 97 + 2 and Ashnav 61 + 2 (both its then-declared releases and a snapshot copy). A combined
consumer with explicit lower-version overrides also passed 11 scenarios. Those configurations concealed
the dependency selection problem in an ordinary consumer.

When the consumer declared only Ashnav followed by Ashtrace, the original Ashnav POM selected Ashcore
1.0.1, Ashgrid 1.2.0 and Ashspace 1.0.0 through Maven's transitive mediation. Compilation failed on
missing APIs including FrameGridSpaceMapper3, BitGrid3iView and SparseGridView3i. The exact original
Ashnav JAR/POM was installed into the isolated repository for this reproduction; a rewritten copied POM
was not accepted as evidence for the declared configuration. `consumer-natural-before.log` includes
both the dependency tree and compilation failure.

Separately, `LowerLayerBoundaryIntegrationTest` failed against the original POM at 11:40:18 +02:00:
mapping an axis value of -Double.MIN_VALUE with cellSize=2 returned node 0 rather than -1. The older
mapper loses the negative value during division. Since both endpoints then map to the same valid node,
that value can produce a spurious found path. Ashspace's correction was already present in `f652173`.
The new test checks all three axes, plain/framed mapping, unreachable results and the exact-zero boundary.

Ashnav now declares **Ashcore 1.1.0-SNAPSHOT, Ashgrid 1.3.0-SNAPSHOT and Ashspace 2.0.0-SNAPSHOT**,
matching the corrected lower stack used by Ashtrace. No production Java changes or public signature
changes were needed. No lower-layer numeric logic was duplicated in Ashnav. This is a documented
dependency migration within unpublished Ashnav 2.0.0-SNAPSHOT; it does not overwrite a released version.

After correction, Ashnav's full gate passed **62 + 2** at 11:43:19 +02:00. The same ordinary consumer
compiled and passed **11 tests** at 11:44:21 +02:00, selecting all three intended lower versions
transitively. It declares no dependency management or direct dependencies to force those lower versions.

### Repeatable procedure and coverage

`scripts/verify-blackframe.ps1` creates a fresh directory inside Ashnav,
copies the five projects, builds them in order with `clean verify` and local install, then runs the
combined consumer in `integration/blackframe/`. It rejects an Ashnav POM that would require
rewriting its dependency versions. The final complete procedure was invoked from Ashnav as follows:

```powershell
./scripts/verify-blackframe.ps1 `
    -Maven '../Ashspace/.verification/apache-maven-3.9.9/bin/mvn.cmd' `
    -JavaHome (Resolve-Path '../Ashspace/.verification/jdk/jdk-21.0.12.1+1').Path `
    -Settings '../Ashcore/.verification/settings.xml' -Offline
```

The 11 consumer tests cover four Ashgrid storage backends (including negative-offset sparse/chunked
windows), eight seeded maps and all N6/N18/N26 neighborhoods. All graph node pairs are checked against
Ashgrid component labels as a separate reachability oracle, and weighted Dijkstra is compared with
stepped zero-heuristic A*. Other checks cover source mutation during a captured search, stepped grid
preprocessing, nested rotations/translations at three cell sizes, relative local coordinates at a 2^54
world origin, underflow contracts, frame removal with explicit snapshots and packaged SPI discovery.

Ashtrace integration uses all four broad-phase indexes for a known body-clearance detour, with a rotated
grid and costs in world units. It checks a subsequent query after removing a dynamic obstacle and uses
half-size voxel occlusion to constrain a coarse navigation graph. Bounds are the fixture's exact box
geometry; the tests do not promote general broad-phase candidates to exact shape intersections.
All five libraries are asserted to load from JARs rather than neighboring target/classes directories.

### Environment limits and CI

Existing plugin/dependency caches were copied into Ashnav with missing files only. An initial offline
attempt failed because cached plugins recorded repository ID `existing-cache`, absent from the empty
settings. Reusing the existing Ashcore verification settings enabled that ID; the retry and all later
runs remained offline. No cache metadata was relabeled and no network resolution was performed.
Sibling tool binaries/settings were read only; the normal Maven repository was not written.

The CI workflow now checks out the tested lower source commits and runs the same verification script,
then exports Ashnav's verified main/source/Javadoc artifacts. This avoids assuming remote availability
of development snapshot artifacts. Both workflows pass actionlint 1.7.7. Remote commit reachability and
an actual GitHub Actions execution remain unverified; those source commits must be available on GitHub
before remote CI can run. Local Windows results do not establish cross-platform behavior.

Development snapshots must be provisioned for a local build. A release still needs a verified set of
published lower versions and the separate release gate. No push, tag, publication or deploy was run.
The earlier performance table remains tied to its original release-dependency configuration and was
not rerun for this dependency migration.

### Final gate and artifact identities

The final complete run finished at **2026-09-10 11:47:55 +02:00**, exit **0**, in
`.verification/cross-library-20260910-114539`. All **503 tests** passed, with zero failures/errors/skips:

| Project | Source commit | Behavior / integration tests | Packaged-artifact tests | Gate completed (+02:00) |
| --- | --- | ---: | ---: | --- |
| Ashcore 1.1.0-SNAPSHOT | `e5194402d0c67d2f29909cfa8c6c51ae137644e7` | 144 | 3 | 11:46:04 |
| Ashgrid 1.3.0-SNAPSHOT | `8199f9be15ff2238514fc392b6580649da42255f` | 102 | 4 | 11:46:29 |
| Ashspace 2.0.0-SNAPSHOT | `f65217331028873a6b5668440496225e4edbfe0d` | 74 | 2 | 11:46:53 |
| Ashtrace 2.0.0-SNAPSHOT | `e07168f5d7a7613fa9cbb3c456aaf0ba7e592756` | 97 | 2 | 11:47:18 |
| Ashnav 2.0.0-SNAPSHOT | checkpoint `ea0c529` plus this correction | 62 | 2 | 11:47:43 |
| Combined packaged consumer | test sources in this correction | 11 | included in those 11 | 11:47:55 |

The consumer dependency tree selects the exact corrected stack transitively from Ashnav and Ashtrace.
These are the main JAR hashes from that final source build, not the older cached binaries recorded above:

| Main JAR | SHA-256 |
| --- | --- |
| ashcore-1.1.0-SNAPSHOT.jar | `314605c8e4ba3565c6a1f574ca9f84cb8693449acbad61ddfd05b3b37d42d1c2` |
| ashgrid-1.3.0-SNAPSHOT.jar | `1c7d24e85ec6d87a7db8105e856371684856a8b2aa9fed9058003d45edee4916` |
| ashspace-2.0.0-SNAPSHOT.jar | `7f0e82346ee9c880a42e68eb24902439af7e9aba5ad7222b39930d9ab3cb0e94` |
| ashtrace-2.0.0-SNAPSHOT.jar | `753b370463d547b0b88d3b7be7712827527de0c3a3aee8c6d6d6c82552c213b0` |
| ashnav-2.0.0-SNAPSHOT.jar | `ce4cc5720c405b459e53362f80669a1fdeaf08ccc026a842b8890df76ae80a0b` |

Ashnav's additional final artifacts under that run's `Ashnav/target` are:

| Artifact | SHA-256 |
| --- | --- |
| ashnav-2.0.0-SNAPSHOT-sources.jar | `d9eb33da2395f068bcc0f832188491b1ba5b1c99d8965c55a7f636c2ab442858` |
| ashnav-2.0.0-SNAPSHOT-javadoc.jar | `6ee815643d5fbd254ecb09a7207a0937b03f28c9dd0f6786a1834fe4d856530e` |

The final run retains `Ashcore.log`, `Ashgrid.log`, `Ashspace.log`, `Ashtrace.log`, `Ashnav.log`,
`consumer.log`, `source-commits.txt`, `source-status.txt`, `artifact-hashes.jsonl` and JUnit XML under
each copied project's target directory. Earlier successful configurations and reproductions remain in
`.verification/cross-library-20260910-113230`, including `declared-boundary-before.log`,
`consumer-natural-before.log`, `Ashnav-fixed.log` and `consumer-natural-after.log`. The settings-ID
failure is in `.verification/cross-library-20260910-113202/Ashcore.log`.

After the final builds, both workflow files passed actionlint and the Git diff passed whitespace checks.
All four sibling repositories remained clean at the listed commits. Later edits only completed this
evidence record and enabled uploading explicitly selected hidden verification logs in CI.
