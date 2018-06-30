import { vec3, quat, mat3, mat4 } from 'gl-matrix';

export default class Node3d {
  nodeId: number;
  position: vec3;
  orientation: quat;
  scale: vec3;
  transform: mat4;
  parent: Node3d | null;
  children: { [key: number]: Node3d };

  constructor() {
    this.nodeId = Node3d.getuid();

    this.position = vec3.create();
    this.orientation = quat.create();
    this.scale = vec3.create();
    this.transform = mat4.create();

    this.parent = null;
    this.children = {};
  }

  /* Static methods */

  static NODE_UID = 0;

  static getuid(): number {
    return ++Node3d.NODE_UID;
  }

  /* Instance methods */

  getId(): number {
    return this.nodeId;
  }

  // Expects the child to also be a node3d
  add(child: Node3d): Node3d {
    child.setParent(this);
    this.children[child.getId()] = child;
    return this;
  }

  remove(child: Node3d): Node3d {
    delete this.children[child.getId()];
    return this;
  }

  setParent(parent: Node3d) {
    this.parent = parent;
  }

  // Returns null if node is an orphan
  getParent(): Node3d | null {
    return this.parent;
  }

  // Returns null if the id isn't present
  getChild(id: number): Node3d | null {
    return this.children[id] || null;
  }

  // Traverses the children of this node, depth-first, and calls func on each one (including the node itself)
  traverseDepthFirst(func: (child: Node3d) => void): Node3d {
    func(this);

    Object.values(this.children).forEach((child: Node3d) => {
      child.traverseDepthFirst(func);
    });

    return this;
  }

  // Traverses the children of this node, breadth-first, and calls func on each one (including the node itself)
  traverseBreadthFirst(func: (child: Node3d) => void): Node3d {
    const queue: Array<Node3d> = [ this ];

    while (queue.length) {
      const child = queue.shift() as Node3d;
      func(child);

      Object.values(child.children).forEach((child: Node3d) => {
        queue.push(child);
      });
    }

    return this;
  }

  // used for lazy calculations of the transform matrix
  private calcTransform() {
    this.transform = mat4.fromRotationTranslationScale(this.transform, this.orientation, this.position, this.scale);
  }

  getTransform(): mat4 {
    // First calculates the transform, then returns a defensive clone of it
    this.calcTransform();
    return mat4.clone(this.transform);
  }

  getPosition(): vec3 {
    // Defensive clone
    return vec3.clone(this.position);
  }

  getDistFrom(point: vec3): number {
    // Returns a number
    return vec3.dist(this.position, point);
  }

  getOrientation(): quat {
    // Defensive clone
    return quat.clone(this.orientation);
  }

  getScale(): vec3 {
    // Defensive clone
    return vec3.clone(this.scale);
  }

  getXAxis(): vec3 {
    const xaxis = vec3.fromValues(1, 0, 0);
    vec3.transformQuat(xaxis, xaxis, this.getOrientation());
    return vec3.normalize(xaxis, xaxis);
  }

  getYAxis(): vec3 {
    const yaxis = vec3.fromValues(0, 1, 0);
    vec3.transformQuat(yaxis, yaxis, this.getOrientation());
    return vec3.normalize(yaxis, yaxis);
  }

  getZAxis(): vec3 {
    const zaxis = vec3.fromValues(0, 0, 1);
    vec3.transformQuat(zaxis, zaxis, this.getOrientation());
    return vec3.normalize(zaxis, zaxis);
  }

  getGlobalTransform(): mat4 {
    const transform = this.getTransform();

    if (this.parent) {
      return mat4.multiply(transform, transform, this.parent.getGlobalTransform());
    }

    return transform;
  }

  getGlobalPosition(): vec3 {
    const position = this.getPosition();

    if (this.parent) {
      return vec3.add(position, position, this.parent.getGlobalPosition());
    }

    return position;
  }

  getGlobalOrientation(): quat {
    let orientation = this.getOrientation();

    if (this.parent) {
      orientation = quat.multiply(orientation, orientation, this.parent.getGlobalOrientation());
      return quat.normalize(orientation, orientation);
    }

    return orientation;
  }

  getGlobalScale(): vec3 {
    const scale = this.getScale();

    if (this.parent) {
      return vec3.multiply(scale, scale, this.parent.getGlobalScale());
    }

    return scale;
  }

  setTransform(position: vec3, orientation: quat, scale: vec3): Node3d {
    this.position = vec3.clone(position);
    this.orientation = quat.clone(orientation);
    quat.normalize(this.orientation, this.orientation);
    this.scale = vec3.clone(scale);
    return this;
  }

  translate(factor: vec3): Node3d {
    vec3.add(this.position, this.position, factor);
    return this;
  }

  // Translates along the local x axis
  translateX(factor: number): Node3d {
    const localXAxis = this.getXAxis();
    vec3.scale(localXAxis, localXAxis, factor);
    return this.translate(localXAxis);
  }

  // Translates along the local y axis
  translateY(factor: number): Node3d {
    const localYAxis = this.getYAxis();
    vec3.scale(localYAxis, localYAxis, factor);
    return this.translate(localYAxis);
  }

  // Translates along the local z axis
  translateZ(factor: number): Node3d {
    const localZAxis = this.getZAxis();
    vec3.scale(localZAxis, localZAxis, factor);
    return this.translate(localZAxis);
  }

  setPosition(position: vec3): Node3d {
    this.position = vec3.clone(position);
    return this;
  }

  rotateQuat(rotation: quat): Node3d {
    quat.multiply(this.orientation, this.orientation, rotation);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  rotateX(xRadians: number): Node3d {
    quat.rotateX(this.orientation, this.orientation, xRadians);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  rotateY(yRadians: number): Node3d {
    quat.rotateY(this.orientation, this.orientation, yRadians);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  rotateZ(zRadians: number): Node3d {
    quat.rotateZ(this.orientation, this.orientation, zRadians);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  rotateMat(inputMat: mat4): Node3d {
    const rotationMat = mat3.fromMat4(mat3.create(), inputMat);
    const rotationQuat = quat.fromMat3(quat.create(), rotationMat);
    quat.normalize(rotationQuat, rotationQuat);
    quat.multiply(this.orientation, this.orientation, rotationQuat);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  setOrientation(orientation: quat): Node3d {
    this.orientation = quat.clone(orientation);
    quat.normalize(this.orientation, this.orientation);
    return this;
  }

  // lookAt // TODO
  // lookAt orients this object at a given position looking at a given other position

  scaleBy(scaleVector: vec3): Node3d {
    this.scale = vec3.multiply(this.scale, this.scale, scaleVector);
    return this;
  }

  scaleMult(factor: number): Node3d {
    this.scale = vec3.scale(this.scale, this.scale, factor);
    return this;
  }

  setScale(scaleVector: vec3): Node3d {
    this.scale = vec3.clone(scaleVector);
    return this;
  }
}
