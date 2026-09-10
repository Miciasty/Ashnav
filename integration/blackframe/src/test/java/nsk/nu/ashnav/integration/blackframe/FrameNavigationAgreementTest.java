package nsk.nu.ashnav.integration.blackframe;

import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashcore.api.spi.ServiceRegistry;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.voxel.traversal.VoxelTraverser;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashgrid.implementation.raster.arrays.ArrayGrid3i;
import nsk.nu.ashnav.api.grid.GridNeighborhood3;
import nsk.nu.ashnav.implementation.grid.FrameMappedGridNavigator3;
import nsk.nu.ashnav.implementation.grid.GridWalkabilityGraph3;
import nsk.nu.ashnav.implementation.grid.SpaceMappedGridNavigator3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import nsk.nu.ashtrace.api.trace.pipeline.FrameGridRayTracer3;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class FrameNavigationAgreementTest {

    @Test
    void nestedFrameCentersAgreeWithAshspaceAcrossScalesAndRotations() {
        for (double size : new double[]{0.25, 0.3, 2.0}) {
            var frames = FrameGraph3.worldRoot();
            var ship = new FrameId("ship");
            var deck = new FrameId("deck");
            var camera = new FrameId("camera");
            frames.define(ship, frames.root(), new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(0, 1, 0), 0.7), new Vector3(-12, 3, 9)));
            frames.define(deck, ship, new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(1, 0, 0), -0.4), new Vector3(2, -1, 4)));
            frames.define(camera, ship, RigidTransform3.translation(-3, 2, 1));
            var origin = new Vector3(-2, 1, -3);
            var graph = graph(4, 3, 2);
            var navigator = new FrameMappedGridNavigator3(graph, mapper(size, origin), frames, deck);
            var mapping = new FrameGridSpaceMapper3(frames, deck, size, origin, new SquareXZChunkScheme(16));
            for (int node = 0; node < graph.nodeCount(); node++) {
                var cell = graph.cellOfNode(node);
                for (var target : List.of(frames.root(), ship, deck, camera)) {
                    Vector3 center = navigator.localCenterOfNode(node, target);
                    Vector3 expected = mapping.cellCenter(cell, target);
                    // Centers are away from faces; 1e-11 world units bounds roundoff in this small fixture.
                    assertEquals(expected.x(), center.x(), 1e-11);
                    assertEquals(expected.y(), center.y(), 1e-11);
                    assertEquals(expected.z(), center.z(), 1e-11);
                    assertEquals(cell, mapping.localToCell(target, center));
                    assertEquals(node, navigator.nodeOfLocalPoint(target, center));
                }
            }
        }
    }

    @Test
    void relativeLocalCoordinatesAvoidTheLargeWorldRoundTrip() {
        var frames = FrameGraph3.worldRoot();
        var ship = new FrameId("ship");
        var tool = new FrameId("tool");
        frames.define(ship, frames.root(), RigidTransform3.translation(0x1.0p54, 0, 0));
        frames.define(tool, ship, RigidTransform3.translation(1, 0, 0));
        var graph = graph(4, 1, 1);
        var navigator = new FrameMappedGridNavigator3(graph, mapper(1, Vector3.ZERO), frames, ship);
        var mapping = new FrameGridSpaceMapper3(frames, ship, 1, Vector3.ZERO, new SquareXZChunkScheme(16));
        var tracer = FrameGridRayTracer3.forGrid(mapping, ServiceRegistry.of(VoxelTraverser.class).require("dda"));
        var ray = new Ray(new Vector3(0.5, 0.5, 0.5), new Vector3(1, 0, 0));
        assertEquals(1, navigator.nodeOfLocalPoint(tool, ray.origin()));
        assertEquals(new CellIndex3(1, 0, 0), mapping.localToCell(tool, ray.origin()));
        var hit = tracer.firstHit(tool, ray, 2, (x, y, z) -> x == 2);
        assertEquals(2, hit.x());
        assertEquals(0.5, hit.tEnter());
        assertEquals(graph.nodeOfCell(hit.x(), hit.y(), hit.z()), navigator.nodeOfLocalPoint(tool, ray.at(1)));
    }

    @Test
    void negativeUnderflowStaysOutsideNavigationWhileTracerRejectsUnrepresentableRay() {
        var frames = FrameGraph3.worldRoot();
        var graph = graph(1, 1, 1);
        var localMapper = mapper(2, Vector3.ZERO);
        var plain = new SpaceMappedGridNavigator3(graph, localMapper);
        var navigator = new FrameMappedGridNavigator3(graph, localMapper, frames, frames.root());
        var mapping = new FrameGridSpaceMapper3(frames, frames.root(), 2, Vector3.ZERO, new SquareXZChunkScheme(16));
        var tracer = FrameGridRayTracer3.forGrid(mapping, ServiceRegistry.of(VoxelTraverser.class).require("dda"));
        for (int axis = 0; axis < 3; axis++) {
            double[] coordinates = {0.5, 0.5, 0.5};
            coordinates[axis] = -Double.MIN_VALUE;
            var point = new Vector3(coordinates[0], coordinates[1], coordinates[2]);
            assertEquals(-1, plain.nodeOfWorldPoint(point));
            assertEquals(-1, navigator.nodeOfWorldPoint(point));
            assertThrows(IllegalArgumentException.class, () -> tracer.firstHit(frames.root(),
                    new Ray(point, new Vector3(1, 0, 0)), 1, (x, y, z) -> { throw new AssertionError("invalid ray queried occupancy"); }));
        }
        assertEquals(0, navigator.nodeOfWorldPoint(Vector3.ZERO));
    }

    @Test
    void capturedNavigationAndTracingStayAlignedAfterFrameRemoval() {
        var frames = FrameGraph3.worldRoot();
        var ship = new FrameId("ship");
        frames.define(ship, frames.root(), RigidTransform3.translation(10, 0, 0));
        var graph = graph(3, 1, 1);
        var navigator = new FrameMappedGridNavigator3(graph, mapper(2, Vector3.ZERO), frames, ship);
        var mapping = new FrameGridSpaceMapper3(frames, ship, 2, Vector3.ZERO, new SquareXZChunkScheme(16));
        var frozen = FrameGridRayTracer3.forGrid(mapping.snapshot(), ServiceRegistry.of(VoxelTraverser.class).require("dda"));
        var live = FrameGridRayTracer3.forGrid(mapping, ServiceRegistry.of(VoxelTraverser.class).require("dda"));
        var oldPoint = navigator.worldCenterOfNode(1);
        frames.remove(ship);
        assertEquals(1, navigator.nodeOfWorldPoint(oldPoint));
        assertEquals(oldPoint, navigator.worldCenterOfNode(1));
        var ray = new Ray(navigator.localCenterOfNode(0, ship), new Vector3(1, 0, 0));
        var hit = frozen.firstHit(ship, ray, 4, (x, y, z) -> x == 1);
        assertEquals(1, hit.x());
        assertEquals(1, navigator.nodeOfWorldPoint(hit.worldPoint()));
        assertThrows(IllegalArgumentException.class, () -> live.firstHit(ship, ray, 4, (x, y, z) -> true));
    }

    @Test
    void consumerLoadsAllFiveLibrariesFromPackagedArtifacts() throws Exception {
        for (Class<?> type : List.of(Vector3.class, ArrayGrid3i.class, FrameGraph3.class,
                FrameGridRayTracer3.class, GridWalkabilityGraph3.class)) {
            Path artifact = Path.of(type.getProtectionDomain().getCodeSource().getLocation().toURI());
            assertTrue(artifact.getFileName().toString().endsWith(".jar"), artifact.toString());
            assertTrue(java.nio.file.Files.isRegularFile(artifact));
        }
        assertEquals("dda", ServiceRegistry.of(VoxelTraverser.class).require("dda").id());
    }

    private static GridWalkabilityGraph3 graph(int width, int height, int depth) {
        return new GridWalkabilityGraph3(new ArrayGrid3i(width, height, depth), value -> true, GridNeighborhood3.N6);
    }

    private static GridSpaceMapper3 mapper(double size, Vector3 origin) {
        return new GridSpaceMapper3(size, origin, new SquareXZChunkScheme(16));
    }
}
