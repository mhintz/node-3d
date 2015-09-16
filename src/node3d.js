var glm = require('gl-matrix');

var NodePrototype = require('./node3dprototype');

function Node3D() {
  if (!(this instanceof Node3D)) {
    return new Node3D();
  }

  constructNode(this);
}

Node3D.prototype = NodePrototype;

function constructNode(newNode) {
  newNode.n_position = glm.vec3.create();
  newNode.n_orientation = glm.quat.create();
  newNode.n_scale = glm.vec3.create();
  newNode.n_transform = glm.mat4.create();
  newNode.n_axis = [];

  newNode.n_parent = null;
  newNode.n_children = [];
  newNode.n_childLookup = {};
  newNode.n_nodeId = Node3D.getuid();
}

var prototypeKeys = Object.keys(NodePrototype).concat([
  'n_position',
  'n_orientation',
  'n_scale',
  'n_transform',
  'n_axis',
  'n_parent',
  'n_children',
  'n_childLookup',
  'n_nodeId',
]);

Node3D.getuid = (function() {
  var id = 0;
  return function getid() { return ++id; };
})();

Node3D.inherits = function(target) {
  for (var i = 0; i < prototypeKeys; ++i) {
    // 'in' checks the prototype chain as well
    if (key in target) {
      console.log('Error: While setting up Node3D in your object, found an existing property clash (' + key + '). Aborting...');
      return false;
    }    
  }

  constructNode(target);

  prototypeKeys.forEach(function(key) {    
    if (NodePrototype.hasOwnProperty(prop)) {
      target.prototype[key] = NodePrototype[key];
    }
  });
};

module.exports = Node3D;
