

var NodePrototype = {

  is

  add: function add(child) {

  },

  remove: function remove(child) {

  },

  getParent: function getParent() {

  },

  getChildren: function getChildren() {

  },

  traverseDepth: function traverseDepth(func) {
    func(this);

    this.children.forEach(function(child) {
      child.traverseDepth(func);
    });
  },

  traverseBreadth: function traverseBreadth(func, queue) {
    func(this);

    var queue = this.getChildren();

    while (queue.length) {
      var child = queue.pop();
      func(child);

      queue.push.apply(queue, child.)
    }
  },

  sortChildren
  getSortedChildren

  getTransform: function getTransform() {

  },

  getPosition
  getDistFrom
  getOrientation
  getScale
  getXAxis
  getYAxis
  getZAxis

  getGlobalTransform: function getGlobalTransform() {

  },

  getGlobalPosition
  getGlobalOrientation
  getGlobalScale

  updateTransform
  setTransform
  translate
  translateX
  translateY
  translateZ
  setPosition
  rotate
  rotateX
  rotateY
  rotateZ
  rotateMat
  setOrientation
  lookAt
  scale
  setScale

};

module.exports = NodePrototype;
