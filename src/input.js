/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

Game = window.Game || {};

(function() {

  var Input = function() {
    this.mouseButtons     = [false, false, false];
    this.mbuttonsPressed  = [false, false, false];
    this.mouseWheelValue  = 0;
    this.keysActive       = {};
    this.keysPressed      = {};
    this.mousePosX        = 0;
    this.mousePosY        = 0;
  };

  Input.prototype.init = function(engine) {
    var self = this;

    window.onkeydown = function(ev) {
      var btn = Game.Utils.keyButton(ev);
      if ( btn.value ) {
        self.keysActive[btn.value] = true;
        self.keysPressed[btn.value] = true;
      }
    };

    window.onkeyup = function(ev) {
      var btn = Game.Utils.keyButton(ev);
      if ( self.keysActive[btn.value] ) {
        delete self.keysActive[btn.value];
      }
    };

    window.onmousedown = function(ev) {
      var btn = Game.Utils.mouseButton(ev) - 1;
      if ( btn >= 0 ) {
        self.mouseButtons[btn] = true;
        self.mbuttonsPressed[btn] = true;
      }
    };

    window.onmouseup = function(ev) {
      var btn = Game.Utils.mouseButton(ev) - 1;
      if ( btn >= 0 ) {
        self.mouseButtons[btn] = false;
      }
    };

    window.onmousemove = function(ev) {
      var pos = Game.Utils.mousePosition(ev);
      self.mousePosX = pos.x;
      self.mousePosY = pos.y;
    };

    window.onmousewheel = function(ev) {
      self.mouseWheelValue = Game.Utils.mouseWheel(ev);
    };

    document.addEventListener('DOMMouseScroll', window.onmousewheel,   false);

    console.log("Input::init()", "Input handling initialized");
  };

  Input.prototype.destroy = function(engine) {
    document.removeEventListener('DOMMouseScroll', window.onmousewheel,   false);

    window.onkeydown    = null;
    window.onkeyup      = null;
    window.onmousedown  = null;
    window.onmouseup    = null;
    window.onmousemove  = null;
    window.onmousewheel = null;

    console.warn('Game.Input', 'Shut down!');
  };

  Input.prototype.update = function(engine) {
    this.mouseWheelValue = 0;
    this.keysPressed     = {};
    this.mbuttonsPressed = [false, false, false];
  };

  Input.prototype.keyDown = function(k) {
    return this.keysActive[k] ? true : false;
  };

  Input.prototype.keyPressed = function(k) {
    return this.keysPressed[k] ? true : false;
  };

  Input.prototype.mouseDown = function(b) {
    return this.mouseButtons[b];
  };

  Input.prototype.mousePressed = function(b) {
    return this.mbuttonsPressed[b];
  };

  Input.prototype.mouseWheel = function() {
    return this.mouseWheelValue;
  };

  Input.prototype.mousePosition = function() {
    return {x: this.mousePosX, y: this.mousePosY};
  };

  Game.Input = new Input();

})();

