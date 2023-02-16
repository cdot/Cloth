import "jquery";
import { Vector3, Line3, Scene, WebGLRenderer, OrthographicCamera } from "three";
import { Mesh } from "./Mesh.js";
import { Vertex } from "./Vertex.js";
import { Edge } from "./Edge.js";

/**
 * A mesh that simulates a piece of cloth, hung from the corners and
 * under the influence of gravity.
 */
class Cloth extends Mesh {

  /**
   * @param scene Scene
   * @param left,top location of the top left corner of the cloth
   * @param width,height width and height of the cloth
   * @param warps the number of vertical threads
   * @param wefts the number of horizontal threads
   */
  constructor(scene, left, top, width, height, warps, wefts) {
    
    super(scene);

    let y_spacing = height / (wefts - 1);
    let x_spacing = width / (warps - 1);

    this.mGravity = new Vector3(0, -height / 150, 0);

    let y = top;
    let prevRow = null;
    for (let weft = 0; weft < wefts; weft++) {
      let row = [];
      
      let x = left;
      let prevPt = null;
      for (let warp = 0; warp < warps; warp++){
        let point = this.addVertex(
          new Vertex(warp + ":" + weft,
                     new Vector3(x, y, 0)));
        row.push(point);

        // pin the four corners
        if ((weft == 0 || weft == wefts - 1)
            && (warp == 0 || warp == warps - 1))
          point.locked = true;
        
        // add a constraint to neighbour to left
        if (prevPt !== null)
          this.addEdge(new Edge(prevPt, point));

        // add a constraint to neighbour above
        if (prevRow !== null)
          this.addEdge(new Edge(prevRow[warp], point));

        x += x_spacing;
        prevPt = point;
      }
      y += y_spacing;
      prevRow = row;
    }
  }

  /**
   * @Override
   * Apply downward gravity on points
   */
  jiggle() {
    for (let p of this.mVertices) {
      if (!p.locked) {
        let new_pos = p.current.clone().multiplyScalar(1.99)
            .sub(p.previous.clone().multiplyScalar(0.99))
            .add(this.mGravity);
        p.current = new_pos;
      }
    }
  }

}

$(function(){
  let inputs = {};

  const $canvas = $("#canvas");
  $canvas.height($canvas.width());
  const canvasRect = $canvas[0].getBoundingClientRect();
  
  const scene = new Scene();
  const renderer = new WebGLRenderer();
  const dim = { w: $canvas.width(), h: $canvas.height() };
  renderer.setSize(dim.w, dim.h);
  $canvas.append(renderer.domElement);
  
  let network = new Cloth(scene, dim.w * 0.05 , dim.h * 0.05 ,
                          dim.w * 0.9, dim.h * 0.9, 15, 15);

  
  // Bloat by 10% in all directions to get the view bounds
  let camera = new OrthographicCamera(
    0, dim.w,
    dim.h, 0,
    -1000, 1000);
  scene.add(camera);
  
  function event2ray(e) {
    let ortho = (camera instanceof OrthographicCamera);

    let pos = new Vector3(
      2 * (e.clientX - canvasRect.left) / canvasRect.width - 1,
      1 - 2 * (e.clientY - canvasRect.top) / canvasRect.height,
      ortho ? -1 : 0.5 /* important */);
    
    pos.unproject(camera);

    let tgt;
    if (ortho) {
      let dir = new Vector3(0, 0, -1);
      dir.transformDirection(camera.matrixWorld);
      tgt = pos.clone().add(dir);
    } else {
      tgt = pos;
      pos = camera.position;
    }
    return new Line3(pos, tgt);
  }

  let vertex; // ref to dragged Vertex
  let mouse = new Vector3(); // mouse position in 3-space
  let key_down, mouse_down; // button flags
  
  function moveVertex(locked) {
    vertex.current = mouse;
    vertex.locked = locked;
  };

  function animate() {
    window.requestAnimationFrame(animate);
    network.update(0.001);
    renderer.render(scene, camera);
  }

  $("#noform").on("submit", () => false);
  
  $canvas.on("keydown", function() {
    key_down = true;
  })
  
  .on("keyup", function() {
    key_down = false;
  })
  
  .on("mouseover", function() {
    $canvas.focus();
  })
  
  .on('mousedown', function(event) {
    mouse_down = true;
    let ray = event2ray(event);
    let hit = network.getClosestVertex(ray);
    vertex = hit.vertex;
    mouse.copy(hit.ray);
    moveVertex(true);
  })

  .on('mouseup', function(event) {
    mouse_down = false;
    moveVertex(key_down);
  })
  
  .on('mousemove', function(event) {
    if (!mouse_down) return;
    let ray = event2ray(event);
    ray.closestPointToPoint(vertex.current, false, mouse);
    moveVertex(true);
  });
  
  $('input').each(function(){
    inputs[$(this).prop('id')] = this;
  });

  animate();
});
