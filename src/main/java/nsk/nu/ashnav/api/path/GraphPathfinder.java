package nsk.nu.ashnav.api.path;

import nsk.nu.ashnav.api.graph.IntGraph;

/**
 * Pathfinder exposing the graph whose node IDs it accepts.
 * Bridges compare this reference by identity, not by node count or graph equality.
 */
public interface GraphPathfinder extends Pathfinder {

    /** Returns the non-null graph used by every query on this solver. */
    IntGraph graph();
}
