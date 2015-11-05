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

  getTransform: function getTransform() {
    this.transform = glm.mat4.fromRotationTranslationScale(glm.mat4.create(), this.orientation, this.position, this.scale);
    return glm.mat4.clone(this.transform);
  },

  getPosition: function getPosition() {
    return glm.vec3.clone(this.position);
  },
  
  getDistFrom: function getDistFrom(point) {
    return glm.vec3.dist(this.position, point);
  },

  getOrientation: function getOrientation() {
    var quatOrien = glm.quat.clone(this.orientation);
    return glm.quat.normalize(quatOrien, quatOrien);
  },

  getScale: function getScale() {
    return glm.vec3.clone(this.scale);
  },

  getXAxis: function getXAxis() {
    var xaxis = glm.vec3.fromValues(1, 0, 0);
    return glm.vec3.transformQuat(xaxis, xaxis, this.getOrientation());
  },

  getYAxis: function getYAxis() {
    var yaxis = glm.vec3.fromValues(0, 1, 0);
    return glm.vec3.transformQuat(yaxis, yaxis, this.getOrientation());
  },

  getZAxis: function getZAxis() {
    var zaxis = glm.vec3.fromValues(0, 0, 1);
    return glm.vec3.transformQuat(zaxis, zaxis, this.getOrientation());
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

  // setTransform

  // translate
  // translateX
  // translateY
  // translateZ
  // setPosition

  // rotate
  // rotateX
  // rotateY
  // rotateZ
  // rotateMat
  // setOrientation
  // lookAt

  // scale
  // setScale

};

/* Static methods */

Node3D.getuid = (function() {
  var id = 0;
  return function getid() { return ++id; };
})();

module.exports = Node3D;
