"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gl_matrix_1 = require("gl-matrix");
var Node3d = /** @class */ (function () {
    function Node3d() {
        this.nodeId = Node3d.getuid();
        this.position = gl_matrix_1.vec3.create();
        this.orientation = gl_matrix_1.quat.create();
        this.scale = gl_matrix_1.vec3.fromValues(1, 1, 1);
        this.transform = gl_matrix_1.mat4.create();
        this.parent = null;
        this.children = {};
    }
    Node3d.prototype.clone = function () {
        var cloned = new Node3d();
        cloned.setTransform(this.position, this.orientation, this.scale);
        return cloned;
    };
    Node3d.prototype.copyFrom = function (other) {
        this.setTransform(other.position, other.orientation, other.scale);
        this.calcTransform();
        return this;
    };
    Node3d.getuid = function () {
        return ++Node3d.NODE_UID;
    };
    /* Instance methods */
    Node3d.prototype.getId = function () {
        return this.nodeId;
    };
    // Expects the child to also be a node3d
    Node3d.prototype.add = function (child) {
        child.setParent(this);
        this.children[child.getId()] = child;
        return this;
    };
    Node3d.prototype.remove = function (child) {
        delete this.children[child.getId()];
        return this;
    };
    Node3d.prototype.setParent = function (parent) {
        this.parent = parent;
    };
    // Returns null if node is an orphan
    Node3d.prototype.getParent = function () {
        return this.parent;
    };
    // Returns null if the id isn't present
    Node3d.prototype.getChild = function (id) {
        return this.children[id] || null;
    };
    // Traverses the children of this node, depth-first, and calls func on each one (including the node itself)
    Node3d.prototype.traverseDepthFirst = function (func) {
        func(this);
        Object.values(this.children).forEach(function (child) {
            child.traverseDepthFirst(func);
        });
        return this;
    };
    // Traverses the children of this node, breadth-first, and calls func on each one (including the node itself)
    Node3d.prototype.traverseBreadthFirst = function (func) {
        var queue = [this];
        while (queue.length) {
            var child = queue.shift();
            func(child);
            Object.values(child.children).forEach(function (child) {
                queue.push(child);
            });
        }
        return this;
    };
    // used for lazy calculations of the transform matrix
    Node3d.prototype.calcTransform = function () {
        this.transform = gl_matrix_1.mat4.fromRotationTranslationScale(this.transform, this.orientation, this.position, this.scale);
    };
    Node3d.prototype.getTransform = function () {
        // First calculates the transform, then returns a defensive clone of it
        this.calcTransform();
        return gl_matrix_1.mat4.clone(this.transform);
    };
    Node3d.prototype.getPosition = function () {
        // Defensive clone
        return gl_matrix_1.vec3.clone(this.position);
    };
    Node3d.prototype.getDistFrom = function (point) {
        // Returns a number
        return gl_matrix_1.vec3.dist(this.position, point);
    };
    Node3d.prototype.getOrientation = function () {
        // Defensive clone
        return gl_matrix_1.quat.clone(this.orientation);
    };
    Node3d.prototype.getScale = function () {
        // Defensive clone
        return gl_matrix_1.vec3.clone(this.scale);
    };
    Node3d.prototype.getXAxis = function () {
        var xaxis = gl_matrix_1.vec3.fromValues(1, 0, 0);
        gl_matrix_1.vec3.transformQuat(xaxis, xaxis, this.orientation);
        return gl_matrix_1.vec3.normalize(xaxis, xaxis);
    };
    Node3d.prototype.getYAxis = function () {
        var yaxis = gl_matrix_1.vec3.fromValues(0, 1, 0);
        gl_matrix_1.vec3.transformQuat(yaxis, yaxis, this.orientation);
        return gl_matrix_1.vec3.normalize(yaxis, yaxis);
    };
    Node3d.prototype.getZAxis = function () {
        var zaxis = gl_matrix_1.vec3.fromValues(0, 0, 1);
        gl_matrix_1.vec3.transformQuat(zaxis, zaxis, this.orientation);
        return gl_matrix_1.vec3.normalize(zaxis, zaxis);
    };
    Node3d.prototype.getGlobalTransform = function () {
        var transform = this.getTransform();
        if (this.parent) {
            return gl_matrix_1.mat4.multiply(transform, transform, this.parent.getGlobalTransform());
        }
        return transform;
    };
    Node3d.prototype.getGlobalPosition = function () {
        var position = this.getPosition();
        if (this.parent) {
            return gl_matrix_1.vec3.add(position, position, this.parent.getGlobalPosition());
        }
        return position;
    };
    Node3d.prototype.getGlobalOrientation = function () {
        var orientation = this.getOrientation();
        if (this.parent) {
            orientation = gl_matrix_1.quat.multiply(orientation, orientation, this.parent.getGlobalOrientation());
            return gl_matrix_1.quat.normalize(orientation, orientation);
        }
        return orientation;
    };
    Node3d.prototype.getGlobalScale = function () {
        var scale = this.getScale();
        if (this.parent) {
            return gl_matrix_1.vec3.multiply(scale, scale, this.parent.getGlobalScale());
        }
        return scale;
    };
    Node3d.prototype.setTransform = function (position, orientation, scale) {
        this.position = gl_matrix_1.vec3.clone(position);
        this.orientation = gl_matrix_1.quat.clone(orientation);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        this.scale = gl_matrix_1.vec3.clone(scale);
        return this;
    };
    Node3d.prototype.translate = function (factor) {
        gl_matrix_1.vec3.add(this.position, this.position, factor);
        return this;
    };
    // Translates along the local x axis
    Node3d.prototype.translateX = function (factor) {
        var localXAxis = this.getXAxis();
        gl_matrix_1.vec3.scale(localXAxis, localXAxis, factor);
        return this.translate(localXAxis);
    };
    // Translates along the local y axis
    Node3d.prototype.translateY = function (factor) {
        var localYAxis = this.getYAxis();
        gl_matrix_1.vec3.scale(localYAxis, localYAxis, factor);
        return this.translate(localYAxis);
    };
    // Translates along the local z axis
    Node3d.prototype.translateZ = function (factor) {
        var localZAxis = this.getZAxis();
        gl_matrix_1.vec3.scale(localZAxis, localZAxis, factor);
        return this.translate(localZAxis);
    };
    Node3d.prototype.setPosition = function (position) {
        this.position = gl_matrix_1.vec3.clone(position);
        return this;
    };
    Node3d.prototype.rotateQuat = function (rotation) {
        gl_matrix_1.quat.multiply(this.orientation, this.orientation, rotation);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    Node3d.prototype.rotateX = function (xRadians) {
        gl_matrix_1.quat.rotateX(this.orientation, this.orientation, xRadians);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    Node3d.prototype.rotateY = function (yRadians) {
        gl_matrix_1.quat.rotateY(this.orientation, this.orientation, yRadians);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    Node3d.prototype.rotateZ = function (zRadians) {
        gl_matrix_1.quat.rotateZ(this.orientation, this.orientation, zRadians);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    Node3d.prototype.rotateMat = function (inputMat) {
        var rotationMat = gl_matrix_1.mat3.fromMat4(gl_matrix_1.mat3.create(), inputMat);
        var rotationQuat = gl_matrix_1.quat.fromMat3(gl_matrix_1.quat.create(), rotationMat);
        gl_matrix_1.quat.normalize(rotationQuat, rotationQuat);
        gl_matrix_1.quat.multiply(this.orientation, this.orientation, rotationQuat);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    Node3d.prototype.setOrientation = function (orientation) {
        this.orientation = gl_matrix_1.quat.clone(orientation);
        gl_matrix_1.quat.normalize(this.orientation, this.orientation);
        return this;
    };
    // lookAt // TODO
    // lookAt orients this object at a given position looking at a given other position
    Node3d.prototype.scaleBy = function (scaleVector) {
        this.scale = gl_matrix_1.vec3.multiply(this.scale, this.scale, scaleVector);
        return this;
    };
    Node3d.prototype.scaleMult = function (factor) {
        this.scale = gl_matrix_1.vec3.scale(this.scale, this.scale, factor);
        return this;
    };
    Node3d.prototype.setScale = function (scaleVector) {
        this.scale = gl_matrix_1.vec3.clone(scaleVector);
        return this;
    };
    /* Static methods */
    Node3d.NODE_UID = 0;
    return Node3d;
}());
exports.default = Node3d;
