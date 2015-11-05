var glm = require('gl-matrix');

function Node3D() {
  if (!(this instanceof Node3D)) {
    return new Node3D();
  }

  this.nodeId = Node3D.getuid();

  this.position = glm.vec3.create();
  this.orientation = glm.quat.create();
  this.scale = glm.vec3.create();
  this.transform = glm.mat4.create();

  this.parent = null;
  this.children = [];
  this.childLookup = {};
}

/* Instance methods */

Node3D.prototype = {

  getId: function getId() {
    return this.nodeId;
  },

  // Expects the child to also be a node3d
  add: function add(child) {
    child.parent = this;
    this.childLookup[child.getId()] = this.children.length;
    this.children.push(child);
    return this;
  },

  remove: function remove(child) {
    var index = this.childLookup[child.getId()];
    if (index) {
      child.parent = null;
      this.children.splice(index, 1);
      delete this.childLookup[child.getId()];
    }
    return this;
  },

  getParent: function getParent() {
    // Returns null if node is an orphan
    return this.parent;
  },

  getChild: function getChild(id) {
    var index = this.childLookup[id];
    // Returns null if the id isn't present
    return this.children[index] || null;
  },

  getChildren: function getChildren() {
    // Defensive clone
    return this.children.slice();
  },

  // Traverses the children of this node, depth-first, and calls func on each one
  traverseDepth: function traverseDepth(func) {
    func(this);

    this.getChildren().forEach(function(child) {
      child.traverseDepth(func);
    });

    return this;
  },

  // Traverses the children of this node, breadth-first, and calls func on each one
  traverseBreadth: function traverseBreadth(func) {
    var queue = [ this ];

    while (queue.length) {
      var child = queue.pop();
      func(child);

      queue.push.apply(queue, child.getChildren());
    }

    return this;
  },

  sortChildren: function sortChildren(func) {
    // Sorts in place
    this.children.sort(func);
    // Got to maintain the validity of the indices in the childLookup
    this.childLookup = this.children.reduce(function(lookup, child, index) {
      lookup[child.getId()] = index;
      return lookup;
    }, {});
    return this;
  },

  getSortedChildren: function getSortedChildren(func) {
    // Involves a defensive clone
    return this.getChildren().sort(func);
  },

  // used for lazy calculations of the transform matrix
  calcTransform: function() {
    this.transform = glm.mat4.fromRotationTranslationScale(this.transform, this.orientation, this.position, this.scale);
    return this;
  },

  getTransform: function getTransform() {
    // First calculates the transform, then returns a defensive clone of it
    this.calcTransform();
    return glm.mat4.clone(this.transform);
  },

  getPosition: function getPosition() {
    // Defensive clone
    return glm.vec3.clone(this.position);
  },
  
  getDistFrom: function getDistFrom(point) {
    // Returns a number
    return glm.vec3.dist(this.position, point);
  },

  getOrientation: function getOrientation() {
    // Defensive clone
    return glm.quat.clone(this.orientation);
  },

  getScale: function getScale() {
    // Defensive clone
    return glm.vec3.clone(this.scale);
  },

  getXAxis: function getXAxis() {
    var xaxis = glm.vec3.fromValues(1, 0, 0);
    glm.vec3.transformQuat(xaxis, xaxis, this.getOrientation());
    return glm.vec3.normalize(xaxis, xaxis);
  },

  getYAxis: function getYAxis() {
    var yaxis = glm.vec3.fromValues(0, 1, 0);
    glm.vec3.transformQuat(yaxis, yaxis, this.getOrientation());
    return glm.vec3.normalize(yaxis, yaxis);
  },

  getZAxis: function getZAxis() {
    var zaxis = glm.vec3.fromValues(0, 0, 1);
    glm.vec3.transformQuat(zaxis, zaxis, this.getOrientation());
    return glm.vec3.normalize(zaxis, zaxis);
  }

  getGlobalTransform: function getGlobalTransform() {
    var transform = this.getTransform();

    if (this.parent) {
      return glm.mat4.multiply(transform, transform, this.parent.getGlobalTransform());
    }

    return transform;
  },

  getGlobalPosition: function getGlobalPosition() {
    var position = this.getPosition();

    if (this.parent) {
      return glm.vec3.add(position, position, this.parent.getGlobalPosition());
    }

    return position;
  },

  getGlobalOrientation: function getGlobalOrientation() {
    var orientation = this.getOrientation();

    if (this.parent) {
      var withParent = glm.quat.multiply(orientation, orientation, this.parent.getGlobalOrientation());
      return glm.quat.normalize(withParent, withParent);
    }

    return orientation;
  },

  getGlobalScale: function getGlobalScale() {
    var scale = this.getScale();

    if (this.parent) {
      return glm.vec3.multiply(scale, scale, this.parent.getGlobalScale());
    }

    return scale;
  },

  setTransform: function setTransform(position, orientation, scale) {
    this.position = glm.vec3.clone(position);
    this.orientation = glm.quat.clone(orientation);
    glm.quat.normalize(this.orientation, this.orientation);
    this.scale = glm.vec3.clone(scale);
    return this;
  },

  translate: function translate(amount) {
    glm.vec3.add(this.position, this.position, amount);
    return this;
  },

  // Translates along the local x axis
  translateX: function translateX(amount) {
    var localXAxis = this.getXAxis();
    glm.vec3.scale(localXAxis, localXAxis, amount);
    return this;
  },

  // Translates along the local y axis
  translateY: function translateY(amount) {
    var localYAxis = this.getYAxis();
    glm.vec3.scale(localYAxis, localYAxis, amount);
    return this;
  },

  // Translates along the local z axis
  translateZ: function translateZ(amount) {
    var localZAxis = this.getZAxis();
    glm.vec3.scale(localZAxis, localZAxis, amount);
    return this;
  },

  setPosition: function setPosition(position) {
    this.position = glm.vec3.clone(position);
    return this;
  },

  rotateQuat: function rotateQuat(quat) {
    glm.quat.multiply(this.orientation, this.orientation, quat);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  rotateX: function rotateX(xRadians) {
    glm.quat.rotateX(this.orientation, this.orientation, xRadians);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  rotateY: function rotateY(yRadians) {
    glm.quat.rotateY(this.orientation, this.orientation, yRadians);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  rotateZ: function rotateZ(zRadians) {
    glm.quat.rotateZ(this.orientation, this.orientation, zRadians);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  rotateMat: function rotateMat(inputMat) {
    var rotationMat = glm.mat3.fromMat4(glm.mat3.create(), inputMat);
    var rotationQuat = glm.quat.fromMat3(glm.quat.create(), rotationMat);
    glm.quat.normalize(rotationQuat, rotationQuat);
    glm.quat.multiply(this.orientation, this.orientation, rotationQuat);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  setOrientation: function setOrientation(orientation) {
    this.orientation = glm.quat.clone(orientation);
    glm.quat.normalize(this.orientation, this.orientation);
    return this;
  },

  // lookAt // TODO

  scale: function scale(scaleVector) {
    this.scale = glm.vec3.multiply(this.scale, this.scale, scaleVector);
    return this;
  },

  setScale: function setScale(scaleVector) {
    this.scale = glm.vec3.clone(scaleVector);
    return this;
  }

};

/* Static methods */

Node3D.getuid = (function() {
  var id = 0;
  return function getid() { return ++id; };
})();

module.exports = Node3D;
