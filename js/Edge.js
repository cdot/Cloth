import { Line, LineBasicMaterial, BufferGeometry } from "three";

const GOOD = new LineBasicMaterial({color: 0x00FF00});
const BAD  = new LineBasicMaterial({color: 0xFF0000});

/**
 * An edge in a mesh which is continuously relaxed
 */
class Edge {
  /**
   * @param p1 Vertex
   * @param p2 Vertex
   * @param length target length. If not given, target length will
   * be |p2-p1|
   */
  constructor(p1, p2, length) {
    this.mP1 = p1;
    p1.addEdge(this);
    this.mP2 = p2;
    p2.addEdge(this);
    if (typeof length === 'number') {
      this.mTargetLength2 = length * length;
      this.mTargetLength = length;
    } else {
      let delta = p1.current.clone().sub(p2.current);
      this.mTargetLength2 = delta.lengthSq();
      this.mTargetLength = delta.length();
    }

    this.mGeometry = new BufferGeometry().setFromPoints([
      p1.current, p2.current
    ]);
    this.mSatisfied = false;
    this.line = new Line(this.mGeometry, GOOD);
  }

  needsUpdate() {
    this.mGeometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * @param maxError how close to the rest length the constraint must
   * be to be satisfied.
   * e.g. 0.1 means within 10%, 0.01 means within 1%. Default is 1% of
   * the target length of the edge.
   */
  satisfy(maxError) {
    if (typeof maxError === "undefined")
      maxError = 0.01;
    let p1_im = this.mP1.locked ? 0 : 1;
    let p2_im = this.mP2.locked ? 0 : 1;
    
    let p1 = this.mP1.current;
    let p2 = this.mP2.current;
    let delta = p2.clone().sub(p1);
    let d2 = delta.lengthSq();

    // Is the constraint satisfied?
    let error = Math.abs(d2 / this.mTargetLength2 - 1);
    if (error < maxError) {
      this.line.material = GOOD;
      this.mSatisfied = true;
    } else {
      this.line.material = BAD;
      this.mSatisfied = false;
    }

    if (p1_im + p2_im === 0 || this.mSatisfied)
      return; // both locked

    // Calculate an increment to take us closer to satisfying
    // the constraint.  When a constraint is satisfied, we
    // already know what the result of the square root
    // operation in a particular constraint expression ought
    // to be, namely the target length. We can use this fact
    // to approximate the square root
    // function. Mathematically, what we do is approximate the
    // square root function by its 1st order Taylor-expansion
    // at a neighborhood of the squared target length r*r
    // (this is equivalent to one Newton-Raphson iteration
    // with initial guess r)

    let diff = (d2 - this.mTargetLength2) / ((this.mTargetLength2 + d2) * (p1_im + p2_im));

    delta.multiplyScalar(diff);

    // delta.z = 0;

    // Manipulate in place so the scene geometry changes
    if (p1_im === 1) {
      p1.add(delta);
      this.mP1.current = p1;
    }

    if (p2_im === 1) {
      p2.sub(delta);
      this.mP2.current = p2;
    }
  }
}

export { Edge }

