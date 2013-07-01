/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  Game.Utils = {};

  /**
   * 2D Vector
   */
  Game.Utils.Vector2 = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;

    this.equals = function(other) {
      return other.x ===  this.x && other.y === this.y;
    };
  };

  /**
   * Deg to Rad
   */
  Game.Utils.convertToRadians = function(degree) {
    return degree*(Math.PI / 180);
  };

  /**
   * Rad to Deg
   */
  Game.Utils.convertToDegree = function(rad) {
    return rad / (Math.PI / 180);
  };

  /**
   * Draw a rotated image onto canvas
   */
  Game.Utils.drawImageRot = function(ctx, img, x, y, width, height, deg){
    var rad = Game.Utils.convertToRadians(deg);
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, width / 2 * (-1),height / 2 * (-1),width,height);
    ctx.rotate(rad * ( -1 ) );
    ctx.translate((x + width / 2) * (-1), (y + height / 2) * (-1));
  };

  /**
   * Radom number range
   */
  Game.Utils.randomRange = function(minVal, maxVal) {
    return Math.floor(Math.random() * (maxVal - minVal - 1)) + minVal;
  };

  /**
   * Clamp value between range
   */
  Game.Utils.clampRange = function(val, min, max) {
    return (val + 1) / 2 * (max - min) + min;
  };

  /**
   * Rectangle intersection check
   */
  Game.Utils.intersectRect = function (r1, r2) {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  };

  /**
   * Get clicked mouse button id
   * @TODO compability
   */
  Game.Utils.mouseButton = function(ev) {
    ev = ev || window.event;
    return ev.which;
  };

  /**
   * Get mouse position
   * @TODO compability
   */
  Game.Utils.mousePosition = function(ev) {
    ev = ev || window.event;
    return {x: ev.pageX, y:ev.pageY};
  };

  /**
   * Get mouse wheel
   * @TODO compability
   */
  Game.Utils.mouseWheel = function(ev) {
    ev = ev || window.event;
    var delta = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
    return delta;
  };

  /**
   * Get key information from KeyboardEvent
   * @TODO add the rest of keycodes
   */
  Game.Utils.keyButton = function(ev) {
    ev = ev || window.event;

    var stored = {
      37 : 'left',
      39 : 'right',
      38 : 'up',
      40 : 'down',
      32 : 'space',
      27 : 'esc',
      18 : 'alt',
      17 : 'ctrl',
      16 : 'shift',
      13 : 'enter',
      8  : 'backspace',
      48 : '0',
      49 : '1',
      50 : '2',
      51 : '3',
      52 : '4',
      53 : '5',
      54 : '6',
      55 : '7',
      56 : '8',
      57 : '9'
    };

    var key = ev.keyCode || ev.which;
    var keyChar = stored[key] || String.fromCharCode(key);

    return {id: key, value: keyChar};
  };

  /**
   * Seed from string
   */
  Game.Utils.createSeed = function(s) {
    if ( typeof s !== "string" ) {
      return s;
    }

    var nums = 0;
    var i = 0, l = s.length, c;
    for ( i; i < l; i++ ) {
      c = s.charCodeAt(i);
      nums += (c * (31 ^ (i-1)));
    }

    return Math.abs(nums);
  };

})();

