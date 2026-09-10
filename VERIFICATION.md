# Ashnav verification and release record

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
