define("js/Line", ["js/GMath", "js/Matrix", "js/Vec3", "js/Plane"], function(GMath, Matrix, Vec3, Plane) {

    let assert = function() {
        if (!arguments[0]) {
            console.assert.apply(null, arguments);
            console.trace();
        }
    };
    
    class Line {
        
        /**
         * Constructor; construct from two points on the line
         * @param a first point (object with {x,y,z})
         * @param b second point (object with {x,y,z})
         */
        constructor(a, b) {
            if (a instanceof Line) {
                b = a.P1; a = a.P0;
            }
            this.P0 = new Vec3(a);
            this.P1 = new Vec3(b);
        }
        
        /**
         * Get the vector described by the two endpoints
         * @return p1 - p0
         */
        get vector() {
            return this.P1.minus(this.P0);
        }

        /**
         * Get the length of a line
         */
        get length() {
            return this.vector.magnitude;
        }

        /**
         * Get the normal direction of the line
         * @return p1 - p0 / |p1 - p0|
         */
        get direction() {
            return this.vector.normalised;
        }
        
        /**
         * Get the midpoint of the line
         * @return p1 - p0 / |p1 - p0|
         */
        get midpoint() {
            return this.P0.plus(this.P1).over(2);
        }
        
        /**
         * Return the position vector of a point on the line
         * as defined by a lambda value relative to p0
         * @param        l        lambda on the line
         * @return        Vec3 position on the line
         */
        getPointOnLine(l) {
            assert(typeof l === "number");
            return this.P0.plus(this.vector.times(l));
        }
        
        /**
         * Return the lambda value for a point on the line
         * @param        p        test point
         * @return lambda on the line
         */
        getLambdaOnLine(p) {
            let lv = this.vector;
            return (p.minus(this.P0).dot(lv)) / lv.magnitude2;
        }
        
        /**
         * Get the square of the distance of the point to the line,
         * assuming the line is infinite.
         * @param        p        test point
         * @return        square of distance of point to infinite line
         */
        distanceI2(p) {
            return (p.minus(this.getNearestPointToI(p))).magnitude2;
        }
        
        /**
         * Get the square of the distance of the point to the finite line.
         * @param        p        test point
         * @return        square of distance of point to finite line
         */
        distanceF2(p) {
            return (p.minus(this.getNearestPointToF(p))).magnitude2;
        }
        
        /**
         * Get the distance of the point to the finite line.
         * @param        p        test point
         * @return        distance of point to finite line
         */
        distanceF(p) {
            return Math.sqrt(this.distanceF2(p));
        }
        
        /**
         * Get the distance of the point to the infinite line.
         * @param        p        test point
         * @return        distance of point to infinite line
         */
        distanceI(p) {
            return Math.sqrt(this.distanceI2(p));
        }
        
        /**
         * Transformation by a matrix
         * @param        m        transformation required
         */
        transformed(m) {
            return new Line(this.P0.transformed(m), this.P1.transformed(m));
        }
        
        /**
         * Return true if this infinite line is colinear with the
         * other infinite line
         * @param        q        Other line
         * @return true if lines are colinear
         */
        isColinear(q) {
            return this.P0.areColinear(this.P1, q.P0)
                && this.P0.areColinear(this.P1, q.P1);
        }
        
        /**
         * Equality test
         * @param        v        other line
         * @return true if lines are equal
         */
        equals(v) {
            return (this.P0.equals(v.P0) &&
                    this.P1.equals(v.P1) ||
                    this.P0.equals(v.P1) &&
                    this.P1.equals(v.P0));
        }
        
        /**
         * Return true if this line is parallel with a line or plane
         * @param        q        test line or plane
         * @return true if line is parallel to other line
         */
        isParallel(q) {
            if (q instanceof Plane)
                return GMath.isZero(this.vector.dot(q.normal));
            
            let dot = Math.abs(this.direction.dot(q.direction));
            return GMath.isZero(dot - 1);
        }
        
        /**
         * Return true if the position p is on the infinite line
         * @param        p        point to test
         * @return true if point is on infinite line
         */
        isOnInfiniteLine(p) {
            if (p.equals(this.P0) || p.equals(this.P1))
                return true;
            
            let t = (p.minus(this.P0)).normalised;
            let myDir = this.direction;
            
            return (t.equals(myDir) || t.equals(myDir.neg));
        }
        
        /**
         * Return true if the position p is on the finite line
         * @param        p        point to test
         * @return true if point is on finite line
         */
        isOnFiniteLine(p) {
            if (!this.isOnInfiniteLine(p))
                return false;

            let l = this.getLambdaOnLine(p);
            return l >= 0 && l <= 1;
        }
        
        /**
         * Get a 4X4 matrix containing a rotation around this line.
         * @param angle angle in radians
         */
        rotationAround(angle) {
            return Matrix.rotationAroundGeneralLine(
                this.P0, this.vector, angle);
        }
        
        /**
         * Return the nearest point to pt on the line p1..p2 as a lambda
         * @param        pt        point to test
         * @return lambda on the line of point nearest to pt
         */
        getNearestLambdaToF(pt) {
            let p1p2 = this.vector;
            let p1pt = pt.minus(this.P0);
            let dot = p1p2.dot(p1pt);
            if (dot > 0) {
                let mag2 = p1p2.magnitude2;
                if (dot < mag2)
                    return dot / mag2;
                // nearest point is beyond the end
                return 1;
            }
            // nearest point is before the start
            return 0;
        }
        
        /**
         * Return the nearest point on the line p1..p2
         * @param        pt        point to test
         * @return point on line nearest to pt
         */
        getNearestPointToF(pt) {
            return this.getPointOnLine(this.getNearestLambdaToF(pt));
        }
        
        /**
         * Return the nearest point to pt on the 'infinite' line p1..p2 as a lambda
         * @param        pt        Point to test
         * @return        lambda of nearest point
         */
        getNearestLambdaToI(pt) {
            let p1p2 = this.vector;
            let p1pt = pt.minus(this.P0);
            return p1p2.dot(p1pt) / p1p2.magnitude2;
        }
        
        /**
         * Return the nearest point to pt on the 'infinite' line p1..p2
         * @param        pt        Point to test
         * @return        nearest point
         */
        getNearestPointToI(pt) {
            return this.getPointOnLine(this.getNearestLambdaToI(pt));
        }
        
        /**
         * Find the point of intersection between an infinite line and a plane.
         * Returns the lambda along the line from A that the intersection
         * occurred at.
         * @param        plane        plane to intersect with
         * @return The lambda of the intersection.
         * Returns < 0 if the line is parallel to the plane.
         * Returns > 1 if the line lies on the plane
         */
        intersectsPlane(plane) {
            assert(plane instanceof Plane);
            let d = this.vector.normalised;
            let length = this.vector.magnitude;
            let dot = plane.normal.dot(d);
            let dist = plane.constant - plane.normal.dot(this.P0);
            
            if (GMath.isZero(dot)) {
                // parallel to the plane
                if (GMath.isZero(dist))
                    return 2;
                return -1;
            }
            return dist / (dot * length);
        }
        
        /**
         * Find the intersection of 'this' and the infinite line defined by 'q'.
         * Returns 'lambda', the fraction of the length of 'this' along the line
         * from  this.P0 that the intersection point is. The actual intersection
         * point can easily found from PointOnLine.
         * @param        plane        plane to intersect with
         * @lambda        lambda        will be set to the intersection lambda
         * @return the lambda of the intersection if one exists. If the lines
         * are colinear, returns > 1. If the lines don't intersect
         * returns < 0.
         */
        intersectsInfiniteLine(q) {
            // Check for shared points first
            if (this.P0.equals(q.P0) || this.P0.equals(q.P1)) {
                if (q.isOnInfiniteLine(this.P1))
                    // colinear
                    return 2;
                else
                    // intersection is this.P0
                    return 0;
            }
            else if (this.P1.equals(q.P0) || this.P1.equals(q.P1)) {
                if (q.isOnInfiniteLine(this.P0)) {
                    // colinear
                    return 2;
                }
                else
                    // intersection is this.P1
                    return 1;
            }

            // Now check for colinearity
            if (this.isColinear(q))
                return 2;

            // compute the plane of A0, B0 and B1 - the plane of lines.
            // For the lines to intersect, they must be coplanar
            let plane;
            if (q.isOnInfiniteLine(this.P0)) {
                // this.P0 must be on the plane because it's on q
                plane = new Plane(this.P1, q.P0, q.P1);
            } else {
                plane = new Plane(this.P0, q.P0, q.P1);
                // this.P1 may not be on the plane...
                if (plane.whichSide(this.P1) != Plane.ONPLANE) {
                    // no intersection, lines not coplanar 
                    return -1;
                }
            }
            let n = plane.normal;
            plane = new Plane(q.P0, q.P1, n.plus(q.P0));
            return this.intersectsPlane(plane);
        }
        
        /**
         * Get the closest approach points of two infinite lines
         * @return { alpha, beta, dist2) where
         * alpha is the closest approach point on this, beta is the closest
         * approach point on l1l, and dist2 contains the square of the distance
         * between them.
         * Returns null if lines are parallel.
         */
        findClosestApproachII(l1l) {
            let l0 = this.vector;
            let l1 = l1l.vector;
            let N = l0.cross(l1);
            if (N.isZero)
                // lines are parallel
                return null;

            let res = [];
            N = N.normalised;
            let diff0 = l1l.P0.minus(this.P0);
            let q = N.times(N.dot(diff0));
            let N2 = l0.cross(N);
            let l0ip = (l1l.P0.minus(q)).
                plus((l1.times(N2.dot(q.minus(diff0))).over(N2.dot(l1))));
            return {
                dist2: q.magnitude2,
                alpha: this.getLambdaOnLine(l0ip),
                beta: l1l.getLambdaOnLine(l0ip.plus(q))
            };
        }
        
        /**
         * Return square of the the closest approach between the infinite
         * line 'this' and the infinite line l1l
         */
        closestApproachII2(l1l) {
            let ca = this.findClosestApproachII(l1l);
            if (ca)
                return ca.dist2;
            // parallel
            let l0 = this.vector;
            let d0 = l1l.P0.minus(this.P0);
            let q = d0.minus(l0.times(l0.dot(d0) / l0.magnitude2));
            return q.magnitude2;
        }
        
        /**
         * find the two closest points on the infinite line 'this' and
         * the infinite line 'l1l'. 'a' is on 'this', 'b' is on 'l1l'.
         * @return a line whose endpoints are the closest points
         */
        closestPointsII(l1l) {
            let ca = this.findClosestApproachII(l1l);
            if (ca)
                return new Line(this.getPointOnLine(ca.alpha),
                                l1l.getPointOnLine(ca.beta));
            // pick arbitrary points on the lines
            return new Line(this.P0, l1l.getNearestPointToI(this.P0));
        }

        /**
         * Return the closest approach between the finite
         * line 'this' and the infinite line l1l
         */
        closestApproachFI2(l1l) {
            let ca = this.findClosestApproachII(l1l);
            if (ca) {
                if (ca.alpha < 0)
                    return l1l.distanceI2(this.P0);
                if (ca.beta > 1)
                    return l1l.distanceI2(this.P1);
                return ca.dist2;
            }
            let l0 = this.vector;
            let d0 = l1l.P0.minus(this.P0);
            let q = d0.minus(l0.times(l0.dot(d0) / l0.magnitude2));
            return q.magnitude2;
        }
        
        /**
         * find the two closest points on the finite line 'this' and
         * the infinite line 'l1l'. 'a' is on 'this', 'b' is on 'l1l'.
         * @return a line whose endpoints are the closest points
         */
        closestPointsFI(l1l) {
            let ca = this.findClosestApproachII(l1l);
            if (ca) {
                let a;
                if (ca.alpha < 0)
                    a = this.P0;
                else if (ca.beta > 1)
                    a = this.P1;
                else
                    a = getPointOnLine(ca.alpha);
                return new Line(a, l1l.getPointOnLine(ca.beta));
            }
            return new Line(this.P0, l1l.getNearestPointToI(this.P0));
        }
        
        /**
         * Return the closest approach between the infinite
         * line 'this' and the finite line l1l
         * @param l1l line to test against
         */
        closestApproachIF2(l1l)        {
            return l1l.closestApproachFI2(this);
        }
        
        /**
         * find the two closest points on the infinite line 'this' and
         * a finite line 
         * @param l1l line to test against
         * @return a line whose endpoints are the closest points
         */
        closestPointsIF(l1l) {
            return l1l.closestPointsFI(this);
        }
        
        /**
         * Return the square of the closest approach between 2 finite lines
         * @param l1l line to test against
         */
        closestApproachFF2(l1l)        {
            // Get the closest approach points of two infinite lines
            let ca = this.findClosestApproachII(l1l);

            if (ca === null) {
                // project l1p0 and l1p1 onto l0
                let pp0 = this.getNearestLambdaToI(l1l.P0);
                let pp1 = this.getNearestLambdaToI(l1l.P1);
                let mag2 = this.vector.magnitude2;
                if (pp0 < 0 && pp1 < 0) {
                    // both endpoints are below p0
                    if (pp0 > pp1)
                        return -mag2 * pp0;
                    return -mag2 * pp1;
                }
                if (pp0 > 1 && pp1 > 1) {
                    // both endpoints are above p1
                    if (pp0 < pp1)
                        return mag2 * (pp0 - 1);
                    return mag2 * (pp1 - 1);
                }
                let l0 = this.vector;
                let d0 = l1l.P0.minus(this.P0);
                let q = d0.minus(l0.times(l0.dot(d0) / l0.magnitude2));
                return q.magnitude2;
            }

            if (ca.alpha < 0) {
                // closest approach is before the start of line 1
                if (ca.beta < 0)
                    // closest approach is before the start of line 2
                    return (this.P0.minus(l1l.P0)).magnitude2;
                if (ca.beta > 1)
                    // closest approach is beyond the end of line 2
                    return (this.P0.minus(l1l.P1)).magnitude2;
                // closest approach is somewhere along line 2
                return l1l.distanceF2(this.P0);
            }

            if (ca.alpha > 1) {
                if (ca.beta < 0)
                    return (this.P1.minus(l1l.P0)).magnitude2;
                if (ca.beta > 1)
                    return (this.P1.minus(l1l.P1)).magnitude2;
                return l1l.distanceF2(this.P1);
            }

            if (ca.beta < 0)
                return this.distanceF2(l1l.P0);
            if (ca.beta > 1)
                return this.distanceF2(l1l.P1);
            return ca.dist2;
        }
        
        /**
         * find the two closest points on the finite line 'this' and
         * the finite line 'l1l'. 
         * @param l1l line to test against
         * @return a line whose endpoints are the closest points
         */
        closestPointsFF(l1l) {
            // Get the closest approach points of two infinite lines
            let ca = this.findClosestApproachII(l1l);

            if (ca == null) {
                // project l1p0 and l1p1 onto l0
                let pp0 = this.getNearestLambdaToI(l1l.P0);
                let pp1 = this.getNearestLambdaToI(l1l.P1);
                let mag2 = this.vector.magnitude2;
                if (pp0 < 0 && pp1 < 0)
                    // both projected endpoints are below p0
                    return new Line(this.P0,
                                    (pp0 > pp1) ? l1l.P0 : l1l.P1);
                if (pp0 > 1 && pp1 > 1)
                    // both projected endpoints are above p1
                    return new Line(this.P1,
                                    (pp0 < pp1) ? l1l.P0 : l1l.P1);
                if (0 <= pp0 && pp0 <= 1) {
                    let b = l1l.P0;
                    return new Line(this.getNearestPointToF(b), b);
                }
                if (0 <= pp1 && pp1 <= 1) {
                    let b = l1l.P1;
                    return new Line(this.getNearestPointToF(b), b);
                }
                return new Line(this.P0, l1l.getNearestPointToF(this.P0));
            } 

            if (ca.alpha < 0) {
                // closest approach is before the start of line 1
                if (ca.beta < 0)
                    // closest approach is before the start of line 2
                    return new Line(this.P0, l1l.P0);
                if (ca.beta > 1)
                    // closest approach is beyond the end of line 2
                    return new Line(this.P0, l1l.P1);
                // closest approach is somewhere along line 2
                return new Line(this.P0, l1l.getNearestPointToF(this.P0));
            }

            if (ca.alpha > 1) {
                if (ca.beta < 0)
                    return new Line(this.P1, l1l.P0);
                if (ca.beta > 1)
                    return new Line(this.P1, l1l.P1);
                return new Line(this.P1, l1l.getNearestPointToF(this.P1));
            }

            let a = this.getPointOnLine(ca.alpha);
            return new Line(a, l1l.getNearestPointToF(a));
        }
        
        /**
         * Return Plane.ONPLANE, Plane.BEHIND Plane.INFRONT or Plane.STRADDLE
         * @param plane plane to test
         */
        whichSide(plane) {
            let side1 = plane.whichSide(this.P0);
            let side2 = plane.whichSide(this.P1);
            
            if (side1 != side2) {
                if (side1 == Plane.ONPLANE)
                    return side2;
                if (side2 == Plane.ONPLANE)
                    return side1;
                return Plane.STRADDLE;
            }
            return side1;
        }
        
        /**
         * Printable representation
         */
        toString() {
            return "{" + this.P0 + "->" + this.P1 + "}";
        }
    }

    return Line;
});
