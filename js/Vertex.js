define("js/Vertex", ["three"], function(Three) {

    const LOCKED   = new Three.MeshBasicMaterial({color: 0xFFFF00});
    const UNLOCKED = new Three.MeshBasicMaterial({color: 0x0000FF});

    /**
     * A vertex in a mesh. The vertex stores current and previous
     * position for use in a Verlet particle system, which uses the
     * previous and current positions of the vertex to compute motion.
     */
    class Vertex {
        /**
         * @param id vertex identifier
         * @param v THREE.Vector3 position of vertex
         */
        constructor(id, v) {
            this.mID = id;
            this.mCurPos = v;
            this.mPrevPos = v.clone();
            this.mEdges = [];
            this.mGeometry = new Three.BoxGeometry(10, 10, 10);
            this.mLocked = false;
            this.marker = new Three.Mesh(this.mGeometry, UNLOCKED);
        }

        addEdge(e) {
            this.mEdges.push(e);
        }
        
        /*
         * @param v THREE.Vector3 current position of vertex
         */
        set current(v) {
            this.mPrevPos.copy(this.mCurPos);
            this.mCurPos.copy(v);
            this.marker.position.set(v.x, v.y, v.z);
            for (let e of this.mEdges)
                e.needsUpdate();
        }
        
        /**
         * @return THREE.Vector3 current position of vertex
         */
        get current() {
            return this.mCurPos;
        }
        
        /**
         * @return THREE.Vector3 last position of vertex
         */
        get previous() {
            return this.mPrevPos;
        }

        set locked(locked) {
            this.marker.material = locked ? LOCKED : UNLOCKED;
            this.mLocked = locked;
        }
        
        get locked() {
            return this.mLocked;
        }
    }
    return Vertex;
});

