define("js/Cloth", ["three", "js/Mesh", "js/Vertex", "js/Edge"], function(Three, Mesh, Vertex, Edge) {

    /**
     * A mesh that simulates a piece of cloth, hung from the corners and
     * under the influence of gravity.
     */
    class Cloth extends Mesh {

        /**
         * @param scene Three.Scene
         * @param left,top location of the top left corner of the cloth
         * @param width, height width and height of the cloth
         * @param warps the number of vertical threads
         * @param wefts the number of horizontal threads
         */
        constructor(scene, left, top, width, height, warps, wefts) {
            
            super(scene);

            let y_spacing = height / (wefts - 1);
            let x_spacing = width / (warps - 1);

            this.mGravity = new Three.Vector3(0, -height / 150, 0);

            let y = top;
            let prevRow = null;
            for (let weft = 0; weft < wefts; weft++) {
                let row = [];
                
                let x = left;
                let prevPt = null;
                for (let warp = 0; warp < warps; warp++){
                    let point = this.addVertex(
                        new Vertex(warp + ":" + weft,
                                   new Three.Vector3(x, y, 0)));
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

    return Cloth;
});

