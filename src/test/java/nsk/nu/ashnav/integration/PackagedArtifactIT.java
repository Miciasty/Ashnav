package nsk.nu.ashnav.integration;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkScheme;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.jar.JarFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class PackagedArtifactIT {

    @TempDir
    Path temporaryDirectory;

    @Test
    void artifactsContainCodeSourcesDocumentationAndNotices() throws Exception {
        String[] types = {
                "api/graph/IntGraph", "api/graph/WeightedIntGraph", "api/grid/GridNeighborhood3",
                "api/path/Pathfinder", "api/path/GraphPathfinder", "api/path/IntHeuristic",
                "api/path/PathResult", "api/path/PathSearchResult", "api/path/PathStatus",
                "implementation/graph/AdjacencyIntGraph", "implementation/graph/WeightedAdjacencyIntGraph",
                "implementation/grid/IntArrayGrid3i", "implementation/grid/GridWalkabilityGraph3",
                "implementation/grid/SpaceMappedGridNavigator3", "implementation/path/BfsPathfinder",
                "implementation/path/DijkstraPathfinder", "implementation/path/AStarPathfinder"
        };
        try (JarFile main = new JarFile(artifact("").toFile());
             JarFile sources = new JarFile(artifact("-sources").toFile());
             JarFile javadoc = new JarFile(artifact("-javadoc").toFile())) {
            for (String type : types) {
                String name = "nsk/nu/ashnav/" + type;
                assertNotNull(main.getEntry(name + ".class"), name);
                assertNotNull(sources.getEntry(name + ".java"), name);
                assertNotNull(javadoc.getEntry(name + ".html"), name);
                try (DataInputStream input = new DataInputStream(main.getInputStream(main.getEntry(name + ".class")))) {
                    assertEquals(0xCAFEBABE, input.readInt());
                    input.readUnsignedShort();
                    assertEquals(65, input.readUnsignedShort(), "Java 21 class version");
                }
            }
            assertNotNull(main.getEntry("META-INF/LICENSE"));
            assertNotNull(main.getEntry("META-INF/NOTICE"));
            assertNotNull(javadoc.getEntry("index.html"));
            assertFalse(main.stream().anyMatch(entry -> entry.getName().startsWith("org/junit/")));
            assertFalse(main.stream().anyMatch(entry -> entry.getName().startsWith("META-INF/services/")),
                    "Ashnav has no SPI providers");
            Properties coordinates = new Properties();
            try (var input = main.getInputStream(main.getEntry("META-INF/maven/dev.nasaka.blackframe/ashnav/pom.properties"))) {
                coordinates.load(input);
            }
            assertEquals("dev.nasaka.blackframe", coordinates.getProperty("groupId"));
            assertEquals("ashnav", coordinates.getProperty("artifactId"));
            assertEquals(System.getProperty("artifactVersion"), coordinates.getProperty("version"));
        }
    }

    @Test
    void readmeQuickStartCompilesAndRunsAgainstPackagedJars() throws Exception {
        String readme = Files.readString(Path.of(System.getProperty("projectDirectory"), "README.md")).replace("\r\n", "\n");
        int start = readme.indexOf("```java\n");
        assertTrue(start >= 0, "README must contain the complete Java quick start");
        int end = readme.indexOf("```", start + 8);
        assertTrue(end > start, "Java quick start must have a closing fence");
        Path source = temporaryDirectory.resolve("AshnavQuickStart.java");
        Files.writeString(source, readme.substring(start + 8, end));
        Path core = dependency(Vector3.class);
        Path grid = dependency(ChunkScheme.class);
        Path space = dependency(GridSpaceMapper3.class);
        String classpath = String.join(File.pathSeparator,
                artifact("").toString(), core.toString(), grid.toString(), space.toString());
        var compiler = ToolProvider.getSystemJavaCompiler();
        assertNotNull(compiler, "Verification requires a JDK");
        ByteArrayOutputStream errors = new ByteArrayOutputStream();
        int result = compiler.run(null, null, errors, "--release", "21", "-encoding", "UTF-8", "-classpath", classpath,
                "-d", temporaryDirectory.toString(), source.toString());
        assertEquals(0, result, errors.toString());
        URL[] urls = {temporaryDirectory.toUri().toURL(), artifact("").toUri().toURL(),
                core.toUri().toURL(), grid.toUri().toURL(), space.toUri().toURL()};
        try (URLClassLoader loader = new URLClassLoader(urls, ClassLoader.getPlatformClassLoader())) {
            Class<?> example = loader.loadClass("AshnavQuickStart");
            example.getMethod("main", String[].class).invoke(null, (Object) new String[0]);
        }
    }

    private static Path artifact(String classifier) {
        return Path.of(System.getProperty("artifactDirectory"), System.getProperty("artifactName") + classifier + ".jar");
    }

    private static Path dependency(Class<?> type) throws Exception {
        Path path = Path.of(type.getProtectionDomain().getCodeSource().getLocation().toURI());
        assertTrue(Files.isRegularFile(path), "Integration dependencies must resolve to packaged JARs: " + path);
        return path;
    }
}
