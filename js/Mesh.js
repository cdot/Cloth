import { Scene, Vector3 } from "three";
import { Vertex } from "./Vertex.js";
import { Edge } from "./Edge.js";

class Mesh {

  /**
   * @param scene Scene
   * @param jiggle function called on each point to move it between
   * each iteration.
   * Used for environmental factors e.g. gravity
   */
  constructor(scene, jiggle) {
    this.mEdges = [];
    this.mVertices = [];
    this.mJiggle = jiggle;
    this.mScene = scene;
  }

  addEdge(e) {
    //assert(e instanceof Edge);
    this.mEdges.push(e);
    this.mScene.add(e.line);
    return e;
  }

  addVertex(v) {
    //assert(v instanceof Vertex);
    this.mVertices.push(v);
    this.mScene.add(v.marker);
    return v;
  }

  get geometry() {
    return this.mGeometry;
  }

  /**
   * Override to jiggle vertices between frames
   */
  jiggle() {
  }
  
  /**
   * Recalculate new positions
   * @param error maximum error as a proportion of the target length for each edge
   */
  update(error) {

    // Move the current point
    
    // Algorithm 1: jiggle each point (e.g. apply gravity)
    this.jiggle();
    
    // Algorithm 2: Try to satisfy constraints.
    // Use 2 iterations (note that the previous pos does not change
    // between iterations)
    for (let i = 0; i < 5; i++)
      for (let c of this.mEdges)
        c.satisfy(error);
  }

  getClosestVertex(ray) {
    let min_dist = Number.MAX_SAFE_INTEGER;
    let min_point = null;
    let ray_pt = null;
    let np = new Vector3();
    
    for (let p of this.mVertices) {
      ray.closestPointToPoint(p.current, false, np);
      let dist2 = np.clone().sub(p.current).lengthSq();
      
      if (dist2 < min_dist) {
        min_dist = dist2;
        min_point = p;
        ray_pt = np.clone();
      }
    }
    
    return { vertex: min_point, ray: ray_pt };
  }
}

export { Mesh }
