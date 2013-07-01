/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {
  var requestAnimFrame = (function() {
    return  window.requestAnimationFrame        ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            window.oRequestAnimationFrame       ||
            window.msRequestAnimationFrame      ||

            function (callback, element) {
              window.setTimeout(callback, 1000/60);
            };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var canvasWidth   = 1280; // Detected
  var canvasHeight  = 720; // Detected
  var running       = false;
  var renderCanvas  = null;
  var renderContext = null;
  var onShutdown    = null;
  var origTitle     = "";
  var titleInterval = null;

  var EngineInstance;
  var LastFrameTime = 0;
  var TimeSinceLastFrame = 0;
  var FPS = 0;

  /////////////////////////////////////////////////////////////////////////////
  // ENGINE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @class
   */
  var Engine = function() {
    if ( !Game.Config ) {
      throw ("Cannot run: no Config found!");
    }
    if ( !Game.Utils ) {
      throw ("Cannot run: no Utils found!");
    }
    if ( !Game.Input ) {
      throw ("Cannot run: no Input found!");
    }
    if ( !Game.Scene ) {
      throw ("Cannot run: no Scene found!");
    }
    if ( !Game.UI ) {
      throw ("Cannot run: no UI found!");
    }

    console.log("Engine::Engine()", "Initializing");

    origTitle      = document.title;
    renderCanvas   = document.getElementById('canvas');
    renderContext  = renderCanvas.getContext('2d');

    this.canvas   = document.createElement('canvas');
    this.context  = this.canvas.getContext('2d');

    if ( !this.canvas ) {
      throw ("Cannot run: no DOMElement<#canvas> found!");
    }
    if ( !this.context ) {
      throw ("Cannot run: no CanvasContext found!");
    }

    var self = this;
    window.onresize = function() {
      self.resize(window.innerWidth, window.innerHeight);
    };

    window.onresize();

    window.onunload = function() {
      self.destroy();
    };

    window.oncontextmenu = function(ev) {
      ev = ev || window.event;
      ev.preventDefault();
      return false;
    };
    window.onselectstart = function(ev) {
      ev = ev || window.event;
      ev.preventDefault();
      return false;
    };
  };

  /**
   * Run engine
   */
  Engine.prototype.run = function(params) {
    if ( running ) return;
    running = true;

    console.log("Engine::run()", "Main loop starting");

    Game.Audio.init(this);
    Game.Input.init(this);
    Game.UI.init(this);

    titleInterval = setInterval(function() {
      document.title = origTitle + " (" + (FPS >> 0) + " fps)";
    }, 1000);

    var self = this;
    Game.Scene.create(this, params, function() {
      self.draw();
    });
  };

  /**
   * Stop running
   */
  Engine.prototype.stop = function() {
    if ( !running ) return;
    var self = this;

    console.warn('Shutting down gracefully...');
    running = false;
    onShutdown = function() {
      self.context.fillStyle = "#000";
      self.context.fillRect(0, 0, canvasWidth, canvasHeight);
      renderContext.drawImage(self.canvas, 0, 0);
      self.destroy();
    };
  };

  /**
   * Destroy (quit) engine
   */
  Engine.prototype.destroy = function() {
    Game.Audio.destroy(this);
    Game.Input.destroy(this);
    Game.Scene.destroy(this);
    Game.UI.destroy(this);

    window.onresize       = null;
    window.onload         = null;
    window.onunload       = null;
    window.oncontextmenu  = null;
    window.onselectstart  = null;

    if ( titleInterval ) {
      clearInterval(titleInterval);
      titleInterval = null;
    }

    console.warn('Game.Engine', 'Shut down!');
  };

  /**
   * Render a frame
   */
  Engine.prototype.draw = function(timeSinceLastFrame) {
    timeSinceLastFrame = timeSinceLastFrame || 0;
    if ( !running ) {
      if ( onShutdown !== null ) onShutdown();
      return;
    }

    this.context.clearRect(0, 0, canvasWidth, canvasHeight);

    if ( Game.Scene.render(timeSinceLastFrame, this, Game.Input, FPS.toFixed(1)) ) {
      running = false;
    }
    Game.UI.render(LastFrameTime, this, Game.Input);

    Game.Audio.update(this);
    Game.Input.update(this);

    renderContext.drawImage(this.canvas, 0, 0);

    var self = this;
    requestAnimFrame(function() {
      var now = new Date();
      TimeSinceLastFrame = LastFrameTime ? (now - LastFrameTime) : 0;
      EngineInstance.draw(TimeSinceLastFrame);

      LastFrameTime = now;
      FPS = 1/(TimeSinceLastFrame / 1000);
    });
  };

  /**
   * Resize instance
   */
  Engine.prototype.resize = function(w, h) {
    if ( w && h ) {
      this.canvas.width   = w;
      this.canvas.height  = h;
      renderCanvas.width  = w;
      renderCanvas.height = h;
    }

    canvasWidth   = parseInt(this.canvas.width, 10);
    canvasHeight  = parseInt(this.canvas.height, 10);

    if ( running ) {
      Game.Scene.resize(this, canvasWidth, canvasHeight);
      Game.UI.resize(this, canvasWidth, canvasHeight);
    }
  };

  /**
   * Get canvas (screen) width
   */
  Engine.prototype.getCanvasWidth = function() {
    return canvasWidth;
  };

  /**
   * Get canvas (screen) height
   */
  Engine.prototype.getCanvasHeight = function() {
    return canvasHeight;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  // Exports
  Game.Engine = {
    initialize : function() {
      if ( !EngineInstance ) {
        EngineInstance = new Engine();
      }

      return EngineInstance;
    },

    get : function() {
      return EngineInstance;
    }
  };

})();

