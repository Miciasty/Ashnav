# Search comparison — 2026-09-10

The same standalone [benchmark program](src/benchmark/java/nsk/nu/ashnav/benchmark/PathSearchBenchmark.java)
was compiled once and run against the previous and extended Ashnav JARs. It uses only the previous
public API. It is excluded from production and the normal test lifecycle.

Baseline: commit `9226c42`, JAR SHA-256
`9c98db2037a31103b27d4f9b35be6b43d1c43d99267f88e7070bf4903022d146`.
The measured extension has the weighted-edge/session implementation committed in `8f59c9d`;
changes between the measurement and that commit only adjusted documentation, tests and constructor
formatting. The later cross-library correction raises dependency versions. This table remains a
historical comparison with the release dependencies below; it was not remeasured with the newer set.

## Environment and method

- AMD Ryzen 9 5950X, 16 physical cores / 32 logical processors; one search thread.
- Windows 11 amd64; Eclipse Adoptium JDK 21.0.12.1+1.
- JVM arguments: `-Xms256m -Xmx256m -Xbatch -XX:+UseSerialGC`.
- Ashcore 1.0.1, Ashgrid 1.2.0 and Ashspace 1.0.0, using the identified release JARs in VERIFICATION.md.
- Three fresh JVM runs per version, alternating baseline/current. For each workload/solver,
  40 warm-up queries precede a measured batch of 100 identical queries.
- Graph construction is outside the timed region. Each measured query includes initialization,
  queue processing, path creation and checking the expected cost. A* uses the zero heuristic.
- Elapsed time uses `System.nanoTime`; allocation uses this JDK's `ThreadMXBean` per-thread byte counter.
  The table reports the median of the three per-batch means, in microseconds and bytes per query.

This is a small local comparison, not JMH, a latency percentile, a concurrent-server benchmark or a
cross-platform guarantee. JVM warm-up, host load and the chosen graph shapes affect the result.
It does not isolate the speedup from edge iteration alone: the extension also changes session layout
and avoids constructing error-message strings for valid inputs. It measures the blocking API;
caller scheduling overhead and very small repeated `advance` calls are outside this comparison.

## Workloads and measured results

All edges cost 1. Every query searches from node 0 to the specified final node.

| Workload | Graph and query |
| --- | --- |
| hub4096 | 4,097 nodes; node 0 connects to all 4,096 other nodes, whose rows are empty. Goal ID 4,096, cost 1. |
| chain512 | 512 nodes in a directed chain. Goal ID 511, cost 511. |
| grid48x48 | Fully walkable 48×1×48 grid, N6 neighborhood. Opposite-corner goal ID 2,303, cost 94. |

| Workload | Solver | Baseline µs/query | Extension µs/query | Baseline bytes/query | Extension bytes/query |
| --- | --- | ---: | ---: | ---: | ---: |
| hub4096 | Dijkstra | 1,737.777 | 470.609 | 574,281.6 | 287,449.6 |
| hub4096 | A* | 1,943.146 | 615.839 | 880,520 | 291,568 |
| chain512 | Dijkstra | 19.230 | 13.845 | 70,760 | 31,560 |
| chain512 | A* | 25.789 | 10.442 | 108,800 | 32,088 |
| grid48x48 | Dijkstra | 345.901 | 255.037 | 499,304 | 178,808 |
| grid48x48 | A* | 599.399 | 263.000 | 1,120,408 | 181,128 |

An initial measurement of the first session implementation exposed regressions: for example,
Dijkstra's chain median rose from about 19.3 to 35.1 µs/query, with allocation rising from 70,760 to
87,704 bytes/query. The final implementation builds numeric-error messages only on failure and
avoids unnecessary heuristic/priority/visited-state operations for Dijkstra. Both measured versions
are retained locally as `benchmark-initial.csv` and `benchmark.csv`; the latter produced this table.

Weighted adjacency iteration now takes O(d) for a row of length d while preserving duplicate emissions
and first-entry costs. The old repeated edge lookup can perform d(d+1)/2 comparisons for d distinct
neighbors. That code-level bound explains why a hub is useful in this comparison, but is not itself
a wall-clock measurement. Public standalone `edgeCost` remains linear; legacy custom graphs using
the default `forEachEdge` can still pay their own lookup costs.

## Reproduction

With a configured JDK 21, first build `mvn -B clean verify`. Compile the benchmark against the current
main JAR and the three production dependency JARs, placing output outside production classes:

```text
javac --release 21 -encoding UTF-8 -cp <current-jar-and-dependencies> -d <benchmark-classes> src/benchmark/java/nsk/nu/ashnav/benchmark/PathSearchBenchmark.java
java -Xms256m -Xmx256m -Xbatch -XX:+UseSerialGC -cp <benchmark-classes-and-baseline-jar-and-dependencies> nsk.nu.ashnav.benchmark.PathSearchBenchmark baseline
java -Xms256m -Xmx256m -Xbatch -XX:+UseSerialGC -cp <benchmark-classes-and-current-jar-and-dependencies> nsk.nu.ashnav.benchmark.PathSearchBenchmark current
```

Classpath separators are `;` on Windows and `:` on Unix. Run each version in a fresh JVM three times.
The local execution script and CSV files remain in ignored `.verification/`; no benchmark artifact
or lower-library change is required for normal consumers.
