package nsk.nu.ashnav.implementation.grid;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashnav.api.graph.IntGraph;
import nsk.nu.ashnav.api.grid.GridNodeMapping3;
import nsk.nu.ashnav.api.path.PathSearchResult;
import nsk.nu.ashnav.api.path.Pathfinder;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

import java.util.HashMap;
import java.util.Map;

/**
 * Graph navigation on a grid attached to an Ashspace coordinate frame.
 * Captures transforms for every defined frame at construction, using Ashspace to compose
 * and invert them. Keep frames unchanged during capture. Later frame edits/removals do not
 * affect this navigator; construct a new navigator to refresh. New frame IDs are unknown here.
 * The traversal graph, mapping and policies are retained and must stay stable during queries.
 *
 * <p>The GridSpaceMapper3 argument describes cell size/origin in gridFrame coordinates,
 * despite its world-named methods. Rigid transforms preserve units; costs are not rescaled.
 * Coordinates are right-handed, Y up in each frame. Floor membership and numeric/precision
 * limits come from the selected Ashspace version; rotation can put a rounded point on either
 * side of a cell boundary. No boundary epsilon or exact round-trip guarantee is added.</p>
 * <p>For F frames and maximum depth h, capture takes O(F*h) time and O(F) retained memory.
 * Each later mapping takes expected O(1) time, plus the supplied node mapping's cost.
 * Search costs are those of the supplied solver. Captured transforms are immutable.</p>
 */
public final class FrameMappedGridNavigator3 {
    private final SpaceMappedGridNavigator3 navigator;
    private final FrameId worldFrame;
    private final Map<FrameId, RigidTransform3> gridFromFrame;
    private final Map<FrameId, RigidTransform3> frameFromGrid;

    public FrameMappedGridNavigator3(GridWalkabilityGraph3 graph, GridSpaceMapper3 gridMapper,
                                     FrameGraph3 frames, FrameId gridFrame) {
        this(graph, graph, gridMapper, frames, gridFrame);
    }

    /**
     * Captures frame transforms and binds a matching graph/mapping. Null objects throw
     * NullPointerException; unknown gridFrame or different node counts throw IllegalArgumentException.
     * Graph/mapping ID semantics are the caller's responsibility, as in SpaceMappedGridNavigator3.
     */
    public FrameMappedGridNavigator3(IntGraph graph, GridNodeMapping3 nodes, GridSpaceMapper3 gridMapper,
                                     FrameGraph3 frames, FrameId gridFrame) {
        if (frames == null) throw new NullPointerException("frames");
        if (gridFrame == null) throw new NullPointerException("gridFrame");
        navigator = new SpaceMappedGridNavigator3(graph, nodes, gridMapper);
        frames.frame(gridFrame);
        worldFrame = frames.root();
        Map<FrameId, RigidTransform3> forward = new HashMap<>();
        Map<FrameId, RigidTransform3> reverse = new HashMap<>();
        for (FrameId frame : frames.frames().keySet()) {
            RigidTransform3 gridFrom = frames.transform(frame, gridFrame);
            forward.put(frame, gridFrom);
            reverse.put(frame, gridFrom.inverse());
        }
        gridFromFrame = Map.copyOf(forward);
        frameFromGrid = Map.copyOf(reverse);
    }

    /** Returns -1 if the transformed point has no mapped node. Unknown/null frames are rejected. */
    public int nodeOfLocalPoint(FrameId source, Vector3 localPoint) {
        return navigator.nodeOfWorldPoint(toGrid(source, localPoint));
    }

    /** Looks up a point in the captured frame graph's root/world coordinates. */
    public int nodeOfWorldPoint(Vector3 worldPoint) {
        return nodeOfLocalPoint(worldFrame, worldPoint);
    }

    /** Returns a node's cell center expressed in a captured target frame. */
    public Vector3 localCenterOfNode(int nodeId, FrameId target) {
        RigidTransform3 targetFrom = requireTransform(frameFromGrid, target);
        return targetFrom.transformPoint(navigator.worldCenterOfNode(nodeId));
    }

    public Vector3 worldCenterOfNode(int nodeId) {
        return localCenterOfNode(nodeId, worldFrame);
    }

    /**
     * Searches between points that can belong to different captured frames. Both conversions
     * use the same captured transforms. Missing endpoints return unreachable(0); solver graph
     * identity is checked as in SpaceMappedGridNavigator3. Coordinate/frame errors throw.
     */
    public PathSearchResult findPath(Pathfinder pathfinder, FrameId startFrame, Vector3 startPoint,
                                     FrameId goalFrame, Vector3 goalPoint) {
        if (pathfinder == null) throw new NullPointerException("pathfinder");
        return navigator.findPath(pathfinder, toGrid(startFrame, startPoint), toGrid(goalFrame, goalPoint));
    }

    public PathSearchResult findPath(Pathfinder pathfinder, Vector3 startWorldPoint, Vector3 goalWorldPoint) {
        return findPath(pathfinder, worldFrame, startWorldPoint, worldFrame, goalWorldPoint);
    }

    private Vector3 toGrid(FrameId source, Vector3 point) {
        if (point == null) throw new NullPointerException("point");
        return requireTransform(gridFromFrame, source).transformPoint(point);
    }

    private static RigidTransform3 requireTransform(Map<FrameId, RigidTransform3> transforms, FrameId frame) {
        if (frame == null) throw new NullPointerException("frame");
        RigidTransform3 transform = transforms.get(frame);
        if (transform == null) throw new IllegalArgumentException("frame was not captured: " + frame);
        return transform;
    }
}
