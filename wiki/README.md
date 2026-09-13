# Ashnav WIKI

English documentation for Ashnav **2.0.0**, based on the Java source and dependency versions in this checkout. The WIKI uses the shared Minecraft documentation template: local assets, dark and light themes, article navigation, local search, syntax highlighting, and copy controls.

## Preview

Open `index.html` directly, or run this command from `wiki` with Node.js 20 or newer:

```powershell
node preview.mjs
```

Open [the preview](http://127.0.0.1:4173). Set `PORT` to another port if needed. Hash routes such as `#/sessions` also work beneath a repository path. The published site does not need Node.js.

## Edit and validate

```powershell
npm ci
npm run build
npm run check:examples
```

`build` compiles Tailwind CSS, validates pages and links, checks diagram calculations, and creates `_site`. `check:examples` needs JDK 21 and Maven 3.9+; it resolves the compile dependencies from the project POM, compiles the current Ashnav sources and every standalone Java example, then runs those examples with assertions enabled. It also compiles three scene exports and checks the browser's adjacency, weights, search results, and captured frames against the Java library. Fragments are reported separately.

The example checker accepts `JAVA_HOME`, `MAVEN_EXECUTABLE`, and `MAVEN_REPO_LOCAL` environment variables. Do not use Java 8 from an older system PATH. Generated validation files stay in the ignored `.checks` directory.

Use `npm run dev` to rebuild CSS while editing and serve the preview. Refresh the browser after each successful build. Edit `src/*.css`, never the generated `assets/styles.css`.

| File | Purpose |
| --- | --- |
| `content/site.js` | Product version, navigation, and verified destinations. |
| `content/helpers.js` | Shared article markup and escaped source examples. |
| `content/guides.js` | Installation, quick start, and runnable examples. |
| `content/spatial.js` | Grid graphs, world mapping, and captured frames. |
| `content/reference.js` | Graph/search contracts, API, troubleshooting, limits, and glossary. |
| `assets/labs.js` | Eight interactive scenes with keyboard controls and Reset. |
| `assets/diagram-models.js` | The finite mathematical models used in those figures. |
| `assets/tower-model.js` / `assets/tower-scene.js` | The 16 × 16 terrain, surface graph, movable barrier, camera, and route-height view. |
| `content/tower-example.js` | The complete Java counterpart of the tower scene. |
| `diagram-cases.mjs` | Shared search fixtures and the generated Java comparison program. |
| `check-tower.mjs` | Tower movement invariants and comparison with the Java example for 18 scenarios. |
| `check.mjs` / `check-diagrams.mjs` | Article/link validation, search scenarios, and coordinate checks. |
| `check-examples.mjs` | Compilation and execution of rendered Java examples. |
| `build.mjs` | Copies browser files and license notices into `_site`. |

Keep source examples, nearby figures, and expected outputs aligned. Every logic explanation needs a relevant figure. Do not add fictional commands, permissions, server versions, or movement rules. `AUTHORING.md` records the documentation basis and source map.

## Publish with GitHub Pages

The repository includes `.github/workflows/pages.yml`. To enable publication:

1. Push this documentation branch and merge the reviewed change into `master`.
2. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run **Ashnav WIKI** on `master`, or let a matching push trigger it.
4. Open the `github-pages` deployment URL shown by the completed workflow.

The expected project address is [miciasty.github.io/Ashnav](https://miciasty.github.io/Ashnav/). This address is a deployment target; the local build does not establish that the site is already live. GitHub's [custom workflow instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) describe the Pages setting and deployment environment.

Pull requests build and validate the site without deploying. The deploy job runs only from `master`. The artifact contains `index.html`, `.nojekyll`, `assets`, `content`, `LICENSE`, and `NOTICE`. Authoring tools, `node_modules`, and source CSS are excluded. No website is published by the local preview or build command.

## Browser review

Check every navigation entry, page/section links, search with Ctrl+K or `/`, Escape, code copying, and both themes. Inspect the mobile drawer and table overflow. For interactive figures, test snapshot rebuilding, reverse edges, all neighborhoods, entry costs, XYZ boundaries, captured/live frames, an overestimating heuristic, and Reset. In the warehouse, test each brush, a sealed route, search steps, and the Java export. Camera controls must not change model results. The site uses no analytics, remote fonts, or runtime CDN.

The tower scene is the first section of Examples (`#/examples?section=tower-route`). Test all three barrier positions, animation/pause, the previous-route overlay, the height inspector, and the no-step policy. Barrier playback is opt-in and uses discrete snapshots. Leaving the article disposes its timer. It does not provide continuous collision prediction or incremental replanning. The SVG scene fits mobile width; camera zoom and rotation remain separate from model inputs.
