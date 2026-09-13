# Documentation basis

Documented version: Ashnav 2.0.0, as declared in `../pom.xml`. Initial source revision: `cecb78a`. Documentation work began from snapshot commit `9ed0ed9` on `docs/ashnav-wiki-20260913`.

The language rules come from `Minecraft Plugins/DOCUMENTATION_DESIGN_TEMPLATE.md`. The visual and authoring format comes from `Minecraft Plugins/DOCUMENTATION_DESIGN_TEMPLATE/WIKI_DESIGN_TEMPLATE.md`. The public WIKI uses American English, as specified by the supplied website template. The older language document describes the template directory as empty; the supplied populated directory establishes the actual website format used here.

## Source map

Paths below are relative to the Ashnav repository unless another repository is named. The public prose explains the behavior directly; this map is for maintainers.

| Articles | Primary source |
| --- | --- |
| Overview, installation, integration | `pom.xml`, `README.md`, `LICENSE`, `NOTICE`; absence of Bukkit dependency and server descriptor in library sources. |
| Graph model, policies | `api/graph/*.java`, `implementation/graph/*.java` beneath `src/main/java/nsk/nu/ashnav`. |
| Grid graphs | `api/grid/*.java`, `implementation/grid/GridWalkabilityGraph3.java`, `IntArrayGrid3i.java`, `GridDimensions.java`. |
| Solvers, sessions | `api/path/*.java`, `implementation/path/*.java`. |
| Results | `PathSearchResult.java`, `PathResult.java`, `PathStatus.java`, session implementations. |
| World coordinates | `SpaceMappedGridNavigator3.java`; Ashspace 2.0.0 `GridSpaceMapper3`; Ashcore 1.2.0 `Vector3`. |
| Local frames | `FrameMappedGridNavigator3.java`; Ashspace 2.0.0 `FrameGraph3`, `FrameId`, `RigidTransform3`. |
| Limits, troubleshooting, API, glossary | The corresponding source contracts above and current `README.md`. |
| Version notes | Current 2.0.0 API and repository history; no invented release dates or benchmark claims. |

The POM pins Ashcore 1.2.0, Ashgrid 1.3.0, and Ashspace 2.0.0. Local sibling repositories help explain dependency types; executable examples resolve the POM's actual compile dependencies. Cached web renderings of the GitHub README can describe older releases, so they do not override this source baseline.

## Terminology

Use **node**, **directed edge**, **edge cost**, **walkable cell**, **graph snapshot**, **node mapping**, **search session**, and **captured frame** consistently. Keep the Java identifiers unchanged. A cost's unit is caller-defined, except BFS uses edge count and the built-in grid uses cell units. A budget counts queue removals; it is not a duration. A route is evidence about a queried graph, not a promise of future Minecraft movement.

## Verification scope

`npm run build` validates article IDs, section links, local assets, publication identity, coverage of navigation, and the finite diagram models. `npm run check:examples` compiles the local Ashnav source and standalone documentation examples with the POM's dependencies, then executes them. These checks do not launch a Minecraft server, validate a Bukkit integration, or benchmark tick latency.

The neighborhood figure illustrates membership, not Ashgrid's offset iteration order. The mapping figure limits inputs to ordinary finite values; it is not a complete reimplementation of Ashspace's numeric validation and underflow rules. Fixed frame diagrams identify their projection and simplified scale.

Retain the vendored Prism MIT license and provenance. The build includes Ashnav's Apache-2.0 license and NOTICE with the runtime files. The original WIKI shell/style sources are retained locally so future changes can be rebuilt without the shared workspace template.

## Verification on 2026-09-13

- PASS: 18 pages, 83 sections, 65 internal content links, navigation, asset presence, JavaScript syntax, and version identity.
- PASS: nine standalone Java programs compiled with JDK 21 against current Ashnav source and the POM's dependencies, then executed with assertions. Eleven Java fragments are intentionally not standalone programs.
- PASS: neighborhood counts and diagonal membership, ordinary cell membership, negative coordinates, and excluded upper boundaries in the browser diagram models.
- PASS: all 18 routes rendered at desktop width and at a 390 × 844 mobile viewport without document-level horizontal overflow.
- PASS: dark/light themes, search, keyboard result selection, Escape, mobile navigation, code copying, diagram selection/reset, and upper-boundary control.
- PASS: the generated site loaded and refreshed beneath `/_site/` with local assets and syntax highlighting; browser warning/error log remained empty.

The build was performed with Node.js 24.14.0 and Tailwind CSS 4.3.3. The locked development dependencies were available in the supplied template. This record does not claim a deployed Pages URL or a live Minecraft server test.
