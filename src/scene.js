/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {
  var TILE_SIZE         = 32;
  var CHUNK_SIZE        = 512;
  var CHUNK_TILES       = CHUNK_SIZE / TILE_SIZE;
  var CHUNK_ALIVE       = 5000; //(5 * 60) * 1000;
  var CHUNK_ALIVE_CHECK = 10000; //(1 * 60) * 1000;

  var PLAYER_STAMINA_TICK = 300;
  var PLAYER_HUNGER_TICK  = 5000;

  var DEFAULT_GEN_MIN   = 0;
  var DEFAULT_GEN_MAX   = 32;
  var DEFAULT_GEN_SEED  = 'default';//0.12312313512341;
  var DEFAULT_GEN_QUAL  = 128.0;
  var DEFAULT_PLAYER_X  = 0;
  var DEFAULT_PLAYER_Y  = 0;

  var MOVE_SPEED        = 5.0;
  var RUN_SPEED         = 8.0;
  var SWIM_SPEED        = 1.0;

  /////////////////////////////////////////////////////////////////////////////
  // VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var canvasWidth   = 0;
  var canvasHeight  = 0;

  var textureSet    = null;
  var player        = null;
  var map           = null;
  var ui            = null;

  var chunkCheckCounter = 0;
  var debugTileOverlay  = false;
  var debugChunkOverlay = false;
  var debugOverlay      = false;
  var debugDetail       = false;
  var cheatMode         = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function hashPair(x, y) {
    return (y << 16) ^ x; //((x + y)*(x + y + 1)/2) + y;
  }

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @class
   */
  var CMap = (function() {

    var cachedChunks  = 0;
    var chunkCache    = {};

    var C = function(params) {
      this.viewRect      = {x:0, y:0, w:0, h:0};
      this.xTileMin      = -1;
      this.xTileMax      = -1;
      this.yTileMin      = -1;
      this.yTileMax      = -1;
      this.xOffset       = 0;
      this.yOffset       = 0;
      this.visibleChunks = 0;
      this.generation    = {
        min       : DEFAULT_GEN_MIN,
        max       : DEFAULT_GEN_MAX,
        quality   : DEFAULT_GEN_QUAL,
        seed      : DEFAULT_GEN_SEED,
        _delta    : -1,
        _num      : 0,
        _float    : 0.0
      };

      for ( var i in params ) {
        if ( this.generation.hasOwnProperty(i) ) {
          this.generation[i] = params[i];
        }
      }

      this.generation._num   = Game.Utils.createSeed(this.generation.seed);
      this.generation._float = parseFloat('0.' + Math.abs(this.generation._num));
      this.generation._delta = this.generation.quality + this.generation._float;

      this.update();
      this.tick();

      console.group('CMap::CMap()', 'Map instance');
      console.log('World', this.generation);
      console.groupEnd();
    };

    C.prototype.destroy = function() {
      console.warn('Game.Scene::CMap', 'Shut down!');
    };

    C.prototype.initialize = function() {
      this.noise = new Game.SimplexNoise(this.generation._num);
    };

    /**
     * On render
     */
    C.prototype.tick = function(timeSinceLastFrame) {
      this.viewRect.x = (canvasWidth / 2)  + player.getX() + this.xOffset;
      this.viewRect.y = (canvasHeight / 2) + player.getY() + this.yOffset;

      this.xTileMin = Math.floor((this.viewRect.x) / CHUNK_SIZE);
      this.xTileMax = Math.floor((this.viewRect.x + this.viewRect.w) / CHUNK_SIZE);
      this.yTileMin = Math.floor((this.viewRect.y) / CHUNK_SIZE);
      this.yTileMax = Math.floor((this.viewRect.y + this.viewRect.h) / CHUNK_SIZE);
    };

    /**
     * Update/Refresh
     */
    C.prototype.update = function() {
      this.viewRect.w = canvasWidth;
      this.viewRect.h = canvasHeight;
      this.xOffset    = -(canvasWidth - (CHUNK_SIZE / 2));
      this.yOffset    = -(canvasHeight - (CHUNK_SIZE / 2));
    };

    /**
     * Get noise for position
     */
    C.prototype.generate = function(cx, cy, tx, ty, layer) {
      layer = (typeof layer === 'undefined') ? 0 : layer;
      var d = this.generation._delta;
      var s = this.generation._float;
      var n = this.noise.snoise(
            ((((cx * CHUNK_TILES) + (tx))) / s) / d,
            ((((cy * CHUNK_TILES) + (ty))) / s) / d,
            layer);
      /*
      var n = this.noise.snoise(
            ((((cx * CHUNK_SIZE) + (tx * TILE_SIZE))) / seed) / delta,
            ((((cy * CHUNK_SIZE) + (ty * TILE_SIZE))) / seed) / delta,
            layer)*/

      return n;
      //return Game.Utils.clampRange(Math.floor(v), min, max);
    };

    /**
     * Draw map tiles or overlays
     */
    C.prototype.draw = function(timeSinceLastFrame, context, overlays) {
      var x, y, visibleChunks = 0, c;

      for ( y = this.yTileMin; y <= this.yTileMax; y++ ) {
        for ( x = this.xTileMin; x <= this.xTileMax; x++ ) {
          if ( overlays ) {
            c = this.getChunk(x, y);
            if ( c ) {
              c.drawObjects(context);
            }
          } else {
            c = this.drawChunk(context, x, y);
            if ( c !== false ) {
              visibleChunks++;
            }
          }
        }
      }

      if ( !overlays ) {
        this.visibleChunks = visibleChunks;
      }
    };

    /**
     * Check if we can remove chunks from cache
     */
    C.prototype.checkChunks = function() {
      var i, l, c, remove = [];
      for ( i in chunkCache ) {
        c = chunkCache[i];
        if ( c.isTimedOut() && !c.inRange(this.viewRect) ) {
          remove.push(i);
        }
      }

      i = 0;
      l = remove.length;
      for ( i; i < l; i++ ) {
        delete chunkCache[remove[i]];
        cachedChunks--;
      }
    };

    /**
     * Clear chunks
     */
    C.prototype.clearChunks = function() {
      chunkCache = {};
      cachedChunks = 0;
    };

    /**
     * Remove chunk
     */
    C.prototype.deleteChunk = function(px, py) {
      var cname = hashPair(px, py);
      if ( chunkCache[cname] ) {
        delete chunkCache[cname];

        return true;
      }
      return false;
    };

    /**
     * Create chunk
     */
    C.prototype.createChunk = function(px, py) {
      var cname = hashPair(px, py);
      if ( chunkCache[cname] ) {
        return chunkCache[cname];
      }
      chunkCache[cname] = new CChunk(px, py);

      cachedChunks++;

      return chunkCache[cname];
    };

    /**
     * Draw chunk on to canvas if in range
     */
    C.prototype.drawChunk = function(context, x, y) {
      var visible = this.isChunkVisible(x, y);
      if ( visible === false ) return false;

      var chunk = this.createChunk(x, y);
      context.drawImage(chunk.res, visible.x, visible.y);

      return chunk;
    };

    /**
     * Check if chunk x,y is in viewable range
     */
    C.prototype.isChunkVisible = function(x, y) {
      var pos = this.getChunkPosition(x, y);
      if ( !Game.Utils.intersectRect( // AABB
          {top:pos.r1.y,left:pos.r1.x,bottom:pos.r1.y+pos.r1.h,right:pos.r2.x+pos.r2.w},
          {top:pos.r2.y,left:pos.r2.x,bottom:pos.r2.y+pos.r2.h,right:pos.r2.x+pos.r2.w}
        ) ) {
        return false;
      }

      return {x: pos.px, y: pos.py};
    };

    /**
     * Check if posX, posY tile is walkable
     */
    C.prototype.isTileWalkable = function(destX, destY) {
      // TODO: Rect intersection on bounds instead ?!
      var destChunk = player.getCurrentChunk(destX, destY);
      var chunk = this.getChunk(destChunk.x, destChunk.y);
      if ( !chunk ) return false;

      var destTile = player.getCurrentTile(destX, destY);
      var tile = chunk.getTile(destTile.x, destTile.y);
      if ( !tile ) return false;

      return tile.isAccessable();
    };

    /**
     * Get chunk absolute position
     */
    C.prototype.getChunkPosition = function(x, y) {
      var r1 = {x:(x * CHUNK_SIZE), y:(y * CHUNK_SIZE), w:CHUNK_SIZE, h:CHUNK_SIZE};
      var r2 = this.viewRect;
      var px = r1.x - r2.x; //(x * CHUNK_SIZE) - viewRect.x;
      var py = r1.y - r2.y; //(y * CHUNK_SIZE) - viewRect.y;

      return {r1:r1, r2:r2, px:px, py:py};
    };

    /**
     * Get a chunk by position
     */
    C.prototype.getChunk = function(x, y, checkVisible) {
      if ( checkVisible ) {
        var v = this.isChunkVisible(x, y);
        if ( this.isChunkVisible(x, y) == false ) return false;
      }
      var c = chunkCache[hashPair(x, y)];
      return c;
    };

    /**
     * Get cached chunk count
     */
    C.prototype.getCachedChunks = function() {
      return cachedChunks;
    };

    /**
     * Get visible chunk count
     */
    C.prototype.getVisibleChunks = function() {
      return this.visibleChunks;
    };

    return C;
  })();

  /**
   * @class
   */
  var CWeapon = function(id) {
    var w = Game.Config.Weapons[id];
    for ( var i in w ) {
      if ( w.hasOwnProperty(i) ) {
        this[i] = w[i];
      }
    }
    console.log('CWeapon::CWeapon()', 'Created', id, w);
  };

  /**
   * @class
   */
  var CPlayer = (function() {
    var bullets = [];

    var _removeBullets = function(remove) {
      var i = 0, l = remove.length;
      for ( i; i < l; i++ ) {
        bullets.splice(remove[i], 1);
      }
    };

    var _updateBullets = function(timeSinceLastFrame) {
      var remove = [];
      var i = 0, l = bullets.length, b, speed;
      for ( i; i < l; i++ ) {
        b = bullets[i];
        speed = (b.speed * (timeSinceLastFrame / 60));

        b.x += Math.sin(b.r) * speed;
        b.y -= Math.cos(b.r) * speed;
        b.t += timeSinceLastFrame;

        if ( b.t >= b.life ) {
          remove.push(i);
        }

        bullets[i] = b;
      }

      _removeBullets(remove);
    };

    var _renderBullets = function(timeSinceLastFrame, context) {
      var i = 0, l = bullets.length, b;
      for ( i; i < l; i++ ) {
        b = bullets[i];

        context.fillStyle = b.color;
        context.fillRect(b.x + (b.w/2), b.y + (b.h/2), b.w, b.h);
      }
    };

    var _createBullet = function(src, dst, bargs) {
      bargs = bargs || {};

      // FIXME
      src.x   = -(src.x + src.cx - map.viewRect.x) - map.xOffset;
      src.y   = -(src.y + src.cy - map.viewRect.y) - map.yOffset;

      var rx = -(dst.x - (dst.w / 2) - map.viewRect.x);
      var ry = -(dst.y - (dst.h / 2) - map.viewRect.y);
      var r = Math.atan2((dst.x - src.x), - (dst.y - src.y));
      r %= (Math.PI * 2);

      var target = {
        sx    : src.x,
        sy    : src.y,
        dx    : dst.x,
        dy    : dst.y,
        x     : src.x,
        y     : src.y,
        r     : r,
        t     : 0,

        w     : bargs.w,
        h     : bargs.h,
        speed : bargs.speed,
        life  : bargs.life,
        color : bargs.color
      };

      bullets.push(target);
    };

    var __index = 0;

    var C = function(params) {
      console.group('CPlayer::CPlayer()', 'Created player', this.index);

      this.r        = 0.0;
      this.x        = (typeof params.x === 'undefined' || params.x === null) ? DEFAULT_PLAYER_X : params.x;
      this.y        = (typeof params.y === 'undefined' || params.y === null) ? DEFAULT_PLAYER_Y : params.y;
      this.w        = Game.Config.Player.sx;
      this.h        = Game.Config.Player.sy;
      this.srot     = Game.Config.Player.rot;
      this.moving   = false;
      this.running  = false;
      this.swimming = false;
      this.index    = __index;
      this.weapon   = 0;

      this.weapons  = [
        new CWeapon(0),
        new CWeapon(1)
      ];

      this.stats  = {
        health    : 100,
        stamina   : 100,
        hunger    : 0,

        _health   : 0,
        _stamina  : 0,
        _hunger   : 0
      };

      console.log('Inited at position', this.x, this.y);
      console.log('Inited with stats', this.stats);
      console.groupEnd();

      __index++;
    };

    C.prototype.destroy = function() {
      console.warn('Game.Scene::CPlayer', 'Shut down!');
    };

    C.prototype.draw = function(timeSinceLastFrame, context) {
      var r     = this.getRelPosition();
      var b     = this.getBoundingBox(true);

      if ( debugDetail ) {
        context.strokeStyle = "#ff0000";
        context.strokeRect(r.x, r.y, this.w, this.h);
      }

      r.x -= this.getCX();
      r.y -= this.getCY();
      b.x -= this.getCX();
      b.y -= this.getCY();

      var pv    = document.createElement('canvas');
      pv.width  = this.w;
      pv.height = this.h;
      var pc    = pv.getContext('2d');

      if ( player.isMoving() ) {
        if ( player.isRunning() ) {
          textureSet.tick(timeSinceLastFrame, pc, 'player', 'run', 0, 0, this.w, this.h);
        } else {
          textureSet.tick(timeSinceLastFrame, pc, 'player', 'walk', 0, 0, this.w, this.h);
        }
      } else {
        textureSet.drawTile(pc, 'player', 'idle', 0, 0, this.w, this.h);
      }
      Game.Utils.drawImageRot(context, pv, r.x, r.y, this.w, this.h, Game.Utils.convertToDegree(this.r) - this.srot);

      if ( debugDetail ) {
        context.strokeStyle = "#0000ff";
        context.strokeRect(b.x, b.y, b.w, b.h);
      }

      _renderBullets(timeSinceLastFrame, context);
    };

    C.prototype.tick = function(timeSinceLastFrame) {
      if ( !cheatMode ) {
        this.stats._stamina += timeSinceLastFrame;
        this.stats._health += timeSinceLastFrame;
        this.stats._hunger += timeSinceLastFrame;

        if ( this.stats._stamina >= PLAYER_STAMINA_TICK ) {
          if ( this.moving ) {
            if ( this.stats.stamina > 0 ) {
              this.stats.stamina -= (this.swimming || this.running ? 2 : 1);
            }
            if ( this.stats.stamina < 0 ) this.stats.stamina = 0;
          } else {
            if ( this.stats.stamina < 100 && this.stats.hunger < 100 ) {
              this.stats.stamina += 5;
              if ( this.stats.stamina > 100 ) this.stats.stamina = 100;
            }
          }

          this.stats._stamina = 0;
        }

        if ( this.stats._hunger >= PLAYER_HUNGER_TICK ) {
          if ( this.stats.hunger >= 100 ) {
            this.stats.health--;
          } else {
            if ( this.stats.hunger < 100 ) {
              this.stats.hunger++;
            }
          }
          this.stats._hunger = 0;
        }
      }

      _updateBullets(timeSinceLastFrame);

      this.moving  = false;
    };

    C.prototype.shoot = function(target) {
      var w = this.weapon;
      if ( w == -1 ) return;

      if ( this.weapons[w].ammo <= 0 ) {
        return;
      }
      this.weapons[w].ammo--;

      var bullet = this.weapons[w].bullet;

      _createBullet({
        x  : this.x,
        y  : this.y,
        cx : this.getCX(),
        cy : this.getCY(),
        r  : this.r
      }, target, bullet);
    };

    C.prototype.prevWeapon = function() {
      if ( !this.weapons.length ) return;

      this.weapon--;
      if ( this.weapon < 0 ) this.weapon = (this.weapons.length - 1);
    };

    C.prototype.nextWeapon = function() {
      if ( !this.weapons.length ) return;

      this.weapon++;
      if ( this.weapon > (this.weapons.length - 1) ) this.weapon = 0;
    };

    C.prototype.move = function(timeSinceLastFrame, pos, running) {
      if ( !this.swimming ) {
        if ( running && this.stats.stamina<=0 ) running = false;
      }

      var spd   = this.swimming ? SWIM_SPEED : (running ? RUN_SPEED : MOVE_SPEED);
      if ( cheatMode ) spd = 10.0;

      var speed = (spd * (timeSinceLastFrame / 60));
      var destX = this.x;
      var destY = this.y;

      if ( pos === 'up' ) {
        destY -= Math.cos(this.r) * speed;
        destX += Math.sin(this.r) * speed;
        this.moving = true;
      } else if ( pos === 'left' ) {
        destX -= Math.cos(this.r) * speed;
        destY -= Math.sin(this.r) * speed;
        this.moving = true;
      } else if ( pos === 'down' ) {
        destY += Math.cos(this.r) * speed;
        destX -= Math.sin(this.r) * speed;
        this.moving = true;
      } else if ( pos === 'right' ) {
        destX += Math.cos(this.r) * speed;
        destY += Math.sin(this.r) * speed;
        this.moving = true;
      }

      this.running  = false;
      this.swimming = false;

      var acc  = cheatMode ? 1 : map.isTileWalkable(destX, destY);
      if ( acc > 0 ) {
        this.x = destX;
        this.y = destY;
        if ( acc === 2 ) {
          this.swimming = true;
        } else {
          this.running = running;
        }
      }
    };

    C.prototype.rotate = function(timeSinceLastFrame, mp) {
      var r  = this.getRelPosition();
      this.r = Math.atan2(mp.x - r.x, - (mp.y - r.y));
      this.r %= (Math.PI * 2);
    };

    C.prototype.getRelPosition = function() {
      var rx   = -(this.getX() - map.viewRect.x) - map.xOffset;
      var ry   = -(this.getY() - map.viewRect.y) - map.yOffset;
      return {x:rx, y:ry};
    };

    C.prototype.getPosition = function() {
      return {x:this.x.toFixed(1), y:this.y.toFixed(1)};
    };

    C.prototype.getBoundingBox = function(rel) {
      var pos = rel ? this.getRelPosition() : this.getPosition();
      return {
        x : pos.x - 16 + this.getCX(),
        y : pos.y - 16 + this.getCY(),
        w : 32,
        h : 32
      };
    };

    C.prototype.getCX = function() {
      return this.w / 2;
    };

    C.prototype.getCY = function() {
      return this.h / 2;
    };

    C.prototype.getX = function() {
      return this.x;
    };

    C.prototype.getY = function(whatY) {
      return this.y;
    };

    C.prototype.getWidth = function() {
      return this.w;
    };

    C.prototype.getHeight = function() {
      return this.h;
    };

    C.prototype.getRot = function() {
      return this.r;
    };

    C.prototype.getUIData = function() {
      var w = this.weapons[this.weapon];
      if ( !w ) w = {name: 'None', ammo: 0};

      return {
        health  : this.stats.health >> 0,
        stamina : this.stats.stamina >> 0,
        hunger  : this.stats.hunger >> 0,
        ammo    : w.ammo,
        weapon  : w.name
      };
    };

    C.prototype.getCurrentChunk = function(x, y) {
      x = (typeof x === 'undefined') ? this.getX() : x;
      y = (typeof y === 'undefined') ? this.getY() : y;

      var px = (x + (CHUNK_SIZE / 2));
      var py = (y + (CHUNK_SIZE / 2));
      return {
        x : Math.floor(px / CHUNK_SIZE),
        y : Math.floor(py / CHUNK_SIZE)
      };
    };

    C.prototype.getCurrentTile = function(x, y) {
      x = (typeof x === 'undefined') ? this.getX() : x;
      y = (typeof y === 'undefined') ? this.getY() : y;

      var px = (x + (CHUNK_SIZE / 2));
      var py = (y + (CHUNK_SIZE / 2));
      return {
        x: Math.floor(px / TILE_SIZE),
        y: Math.floor(py / TILE_SIZE)
      }
    };

    C.prototype.isRunning = function() {
      return this.running;
    };

    C.prototype.isMoving = function() {
      return this.moving;
    };

    return C;
  })();

  /**
   * @class
   */
  var CTextureSet = (function() {
    /**
     * Private
     */
    var _inQueue      = 0;
    var _queueFailed  = 0;
    var _queueDone    = null;

    var _imageLoaded = function(ok, id, src, img, callback) {
      if ( ok ) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        callback(id, context, src);
      } else {
        _queueFailed++;

        callback(id, false, src);
      }

      _inQueue--;
      if ( _inQueue <= 0 ) {
        _queueDone(_queueFailed);
      }
    };

    var _loadImage = function(id, src, callback) {
      _inQueue++;

      var img = document.createElement('img');
      img.onload = function _loadImageOnLoad() {
        _imageLoaded(true, id, src, this, callback);
      };
      img.onerror = function _loadImageOnError() {
        _imageLoaded(false, id, src, this, callback);
      };

      img.src = src;
    };

    /**
     * Public
     */
    var C = function(opts, sets) {
      this.options = {};

      console.group('CTextureSet::CTextureSet()');

      var i;
      for ( i in opts ) {
        if ( this.options.hasOwnProperty(i) ) {
          this.options[i] = opts[i];
        }
      }

      var a;
      for ( i in sets ) {
        if ( sets.hasOwnProperty(i) ) {
          sets[i]._context = null;
          if ( sets[i].animations ) {
            for ( a in sets[i].animations ) {
              sets[i].animations[a]._lastTime = 0; //new Date();
              sets[i].animations[a]._current  = sets[i].animations[a].frames[0] || 0;

              console.log('inited animation for', i, '=>', a);
            }
          }
        }
      }
      this.sets = sets;

      console.log('Options', this.options);
      console.log('Sets', this.sets);
      console.groupEnd();
    };

    C.prototype.destroy = function() {
      console.warn('Game.Scene::CTextureSet', 'Shut down!');
    };

    C.prototype.getTileIndex = function(set, id) {
      var idx = -1;
      var i = 0, l = set.ids.length;
      for ( i; i < l; i++ ) {
        if ( set.ids[i] == id ) {
          idx = i;
          break;
        }
      }

      return idx;
    };

    C.prototype.drawTile = function(context, set, id, dx, dy, dw, dh) {
      var set = this.sets[set];
      if ( !set || !set._context ) return false;

      var idx = this.getTileIndex(set, id);
      if ( idx >= 0 ) {
        var sx = set.sx * idx;
        var sy = 0;
        var sw = set.sx;
        var sh = set.sy;

        context.drawImage(set._context.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
        return true;
      }
      return false;
    };

    C.prototype.drawObj = function(context, set, id, rx, ry, rw, rh) {
      var set = this.sets[set];
      if ( !set || !set._context ) return false;


      var idx = this.getTileIndex(set, id);
      if ( idx >= 0 ) {
        var sx = set.sx * idx;
        var sy = 0;
        var sw = set.sx;
        var sh = set.sy;

        var dx = (rx + (rw / 2)) - set.cx;
        var dy = (ry + (rh / 2)) - set.cy;
        var dw = sw;
        var dh = sh;

        context.drawImage(set._context.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
        return true;
      }
      return false;
    };

    C.prototype.getTile = function(set, id) {
      var set = this.sets[set];
      if ( !set || !set._context ) return false;

      var idx = this.getTileIndex(set, id);
      if ( idx >= 0 ) {
        var canvas = document.createElement('canvas');

        var sx = set.sx * idx;
        var sy = 0;
        var sw = set.sx;
        var sh = set.sy;

        var dx = 0;
        var dy = 0;
        var dw = sw;
        var dh = sh;

        canvas.width  = dw;
        canvas.height = dh;

        var context = canvas.getContext('2d');
        context.drawImage(set._context, sx, sy, sw, sh, dx, dy, dw, dh);
        return context;
      }

      return false;
    };

    C.prototype.load = function(callback) {
      console.group('CTextureSet::load()', 'Loading tetures');

      var self = this;
      _queueDone = function(failed) {
        console.groupEnd();
        console.log('CTextureSet::load()', 'Done', failed, 'failed');
        callback(failed === 0);
      };

      var i;
      for ( i in this.sets ) {
        if ( this.sets.hasOwnProperty(i) ) {
          console.log('CTextureSet::load()', 'adding', i);

          _loadImage(i, this.sets[i].src, function(id, context, src) {
            if ( context ) {
              console.log('CTextureSet::load()', 'loaded', id, src);
            } else {
              console.log('CTextureSet::load()', 'failed', id, src);
            }

            self.sets[id]._context = context || null;
          })
        }
      }
    };

    C.prototype.tick = function(timeSinceLastFrame, context, setid, anid, dx, dy, dw, dh) {
      var set = this.sets[setid];
      if ( !set || !set._context ) return false;
      var now     = new Date();
      var anim    = set.animations[anid];
      var diff    = now - anim._lastTime;
      var current = anim._current;

      if ( (diff >= anim.duration) && (diff !== now) ) {
        current++;
        if ( current > anim.frames[anim.frames.length-1] ) {
          current = anim.frames[0]
        }

        this.sets[setid].animations[anid]._lastTime = now;
        this.sets[setid].animations[anid]._current  = current;
      }

      if ( diff === now ) this.sets[setid].animations[anid]._lastTime = now;

      var sx = set.sx * current;
      var sy = 0;
      var sw = set.sx;
      var sh = set.sy;

      context.drawImage(set._context.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    };


    return C;
  })();

  /**
   * @class
   */
  var CTileData = function(ax, ay, tx, ty, typeId, type, subType) {
    this.aX   = ax;
    this.aY   = ay;
    this.x    = tx;
    this.y    = ty;
    this.t    = type;
    this.tid  = typeId;
    this.sub  = subType;
  };

  CTileData.prototype.isWalkable = function() {
    if ( this.sub ) return false;
    return this.t == 'sand' || this.t == 'grass' || this.t == 'gravel';
  };

  CTileData.prototype.isSwimmable = function() {
    if ( this.sub ) return false;
    return this.t == 'water';
  };

  CTileData.prototype.isAccessable = function() {
    if ( this.isWalkable() ) return 1;
    if ( this.isSwimmable() ) return 2;
    return 0;
  };

  /**
   * @class
   */
  var CChunk = function(cx, cy) {
    this.x        = cx;
    this.y        = cy;
    this.res      = null;
    this.created  = new Date();
    this.tiles    = {};
    this.objects  = [];

    this.initialize();
  };

  CChunk.prototype.initialize = function() {
    var canvas    = document.createElement('canvas');
    var context   = canvas.getContext('2d');
    canvas.width  = CHUNK_SIZE;
    canvas.height = CHUNK_SIZE;

    var cx      = this.x;
    var cy      = this.y;
    var ttype   = '';
    var subtype = '';

    var x = 0, y = 0, v, vv, z;
    var atx = 0, aty = 0;

    for ( y = 0; y < CHUNK_TILES; y++ ) {
      for ( x = 0; x < CHUNK_TILES; x++ ) {
        atx = x + ((cx*CHUNK_SIZE/CHUNK_SIZE) * CHUNK_TILES);
        aty = y + ((cy*CHUNK_SIZE/CHUNK_SIZE) * CHUNK_TILES);
        z   = hashPair(atx, aty);
        v   = map.generate(cx, cy, x, y);

        ttype = 'water';
        subtype = '';
        if ( v > 0 ) {
          if ( v <= 0.1 ) {
            ttype = 'sand';
          } else if ( v <= 0.4 ) {
            ttype = 'grass';
            if ( v >= 0.30 && v <= 0.35 ) {
              subtype = 'tree';
            }
          } else {
            ttype = 'stone';
          }
        }

        textureSet.drawTile(context, 'terrain', ttype, (TILE_SIZE * x), (TILE_SIZE * y), TILE_SIZE, TILE_SIZE);

        if ( debugDetail ) {
          context.fillStyle = "#444";
          context.fillText(atx, (TILE_SIZE*x)+5, (TILE_SIZE*y)+15);
          context.fillStyle = "#888";
          context.fillText(aty, (TILE_SIZE*x)+10, (TILE_SIZE*y)+20);
        }

        this.tiles[z] = new CTileData(atx, aty, x, y, v, ttype, subtype);

        if ( subtype ) {
          this.objects.push(z);
        }
      }
    }

    if ( debugTileOverlay ) {
      context.lineWidth = 0.1;
      context.strokeStyle = "#111";

      for ( y = 0; y < CHUNK_TILES; y++ ) {
        for ( x = 0; x < CHUNK_TILES; x++ ) {
          context.strokeRect((TILE_SIZE * x), (TILE_SIZE * y), TILE_SIZE, TILE_SIZE);
        }
      }
    }

    if ( debugChunkOverlay ) {
      context.lineWidth = 0.3;
      context.strokeStyle = "#000";
      context.strokeRect(0, 0, CHUNK_SIZE, CHUNK_SIZE);

      context.fillStyle = "#000";
      context.fillText(cx + "," + cy, 5, 15);
    }

    this.res = canvas;
  };

  CChunk.prototype.drawObjects = function(context) {
    var i = 0, l = this.objects.length, t;
    if ( !l ) return;

    var r1, r2, px, py, pos;
    for ( i; i < l; i++ ) {
      t = this.tiles[this.objects[i]];
      if ( t.sub == 'tree' ) {
        pos = map.getChunkPosition(this.x, this.y); // We already checked AABB
        textureSet.drawObj(context, 'trees', 'palm', pos.px + (TILE_SIZE * t.x), pos.py + (TILE_SIZE * t.y), TILE_SIZE, TILE_SIZE);
      }
    }
  };

  CChunk.prototype.inRange = function(rect) {
    var r1 = this.getRect();
    var r2 = rect;
    var c1 = {top:r1.y,left:r1.x,bottom:r1.y+r1.h,right:r2.x+r2.w};
    var c2 = {top:r2.y,left:r2.x,bottom:r2.y+r2.h,right:r2.x+r2.w};
    return Game.Utils.intersectRect(c1, c2);
  };

  CChunk.prototype.isTimedOut = function() {
    return ((new Date()) - this.created) >= CHUNK_ALIVE;
  };

  CChunk.prototype.getRect = function() {
    return {x:(this.x * CHUNK_SIZE), y:(this.y * CHUNK_SIZE), w:CHUNK_SIZE, h:CHUNK_SIZE};
  };

  CChunk.prototype.getTile = function(x, y) {
    return this.tiles[hashPair(x, y)];
  };

  /////////////////////////////////////////////////////////////////////////////
  // SCENE
  /////////////////////////////////////////////////////////////////////////////

  function CreateScene(engine, params, callback) {
    Game.UI.setScreen(Game.UI.SCREEN_GAME);

    canvasWidth   = engine.getCanvasWidth();
    canvasHeight  = engine.getCanvasHeight();

    engine.context.textBaseline = "top";

    engine.context.font = "bold 20pt Monospace";
    engine.context.fillStyle = "#fff";
    var dim = engine.context.measureText('Loading...');
    engine.context.fillText('Loading...', ((canvasWidth - dim.width) / 2), ((canvasHeight) / 2));
    engine.context.font = "bold 9pt Monospace";

    player     = new CPlayer(params.init || {});
    map        = new CMap(params.world || {});
    textureSet = new CTextureSet({}, Game.Config.Textures || {});

    console.log('CreateScene()', 'Inited -- loading textures');

    var self = this;

    var __onTerrainGenerated = function onTerrainGenerated(callback) {
      console.log('CreateScene()', 'Done initing terrain!');

      setTimeout(function() {
        callback();
      }, 500);
    };

    var __onTileSetLoaded = function onTileSetLoaded(success) {
      if ( !success ) {
        console.error('CreateScene()', 'Cannot continue -- Error loading textures!');
        return;
      }

      console.log('CreateScene()', 'Done loading textures!');

      map.initialize();
      __onTerrainGenerated(callback);
    };

    var __onAudioLoaded = function onAudioLoaded(success) {
      if ( !success ) {
        console.error('CreateScene()', 'Cannot continue -- Error loading audio!');
        return;
      }

      console.log('CreateScene()', 'Done initing audio!');
      textureSet.load(__onTileSetLoaded);
    };

    Game.Audio.load((Game.Config.Sounds || {}), __onAudioLoaded);
  }

  function RenderScene(timeSinceLastFrame, engine, input, fps) {
    Update(timeSinceLastFrame, engine, input);

    map.draw(timeSinceLastFrame, engine.context);
    player.draw(timeSinceLastFrame, engine.context);
    map.draw(timeSinceLastFrame, engine.context, true);

    engine.context.fillStyle = "#000";
    if ( debugOverlay ) {
      var cpos = player.getCurrentChunk();
      var tpos = player.getCurrentTile();
      var cnum = map.getCachedChunks();
      var vchu = map.getVisibleChunks();
      var ppos = player.getPosition();
      var text = [vchu, "visible chunks,", cnum, "cached", "[X:", ppos.x, " Y:", ppos.y, "] [cX:" + cpos.x, " cY:" + cpos.y, "] [tX:", tpos.x, " tY:", tpos.y, "]"];
      if ( cheatMode ) {
        text.push("*");
      }
      engine.context.fillText(text.join(" "), 5, 5);
    }

    engine.context.fillText("2D Tile Engine (c) Anders Evenrud", (canvasWidth - 190), 5);

    if ( debugDetail ) {
      engine.context.beginPath();
      engine.context.moveTo(canvasWidth/2,0);
      engine.context.lineTo(canvasWidth/2, canvasHeight);
      engine.context.moveTo(0, canvasHeight/2);
      engine.context.lineTo(canvasWidth, canvasHeight/2);
      engine.context.stroke();
      engine.context.closePath();
    }

    chunkCheckCounter += timeSinceLastFrame;
    if ( chunkCheckCounter >= CHUNK_ALIVE_CHECK ) {
      map.checkChunks();
      chunkCheckCounter = 0;
    }

    //return true; // Render only one frame
  }

  function DestroyScene(engine) {
    player.destroy();
    map.destroy();
    textureSet.destroy();
  }

  function ResizeScene(engine, width, height) {
    if ( width === canvasWidth && height === canvasHeight ) 
      return;

    canvasWidth   = width;
    canvasHeight  = height;

    map.update();
  }

  function Update(timeSinceLastFrame, engine, input) {
    player.tick(timeSinceLastFrame); // First

    var running = input.keyDown("shift");
    if ( input.keyDown("W") ) {
      player.move(timeSinceLastFrame, 'up', running);
    } else if ( input.keyDown("A") ) {
      player.move(timeSinceLastFrame, 'left', running);
    } else if ( input.keyDown("S") ) {
      player.move(timeSinceLastFrame, 'down', running);
    } else if ( input.keyDown("D") ) {
      player.move(timeSinceLastFrame, 'right', running);
    }

    if ( input.mousePressed(0) ) {
      player.shoot(input.mousePosition());
    }

    if ( input.mouseWheel() > 0.0 ) {
      player.prevWeapon();
    } else if ( input.mouseWheel() < 0.0 ) {
      player.nextWeapon();
    }

    player.rotate(timeSinceLastFrame, input.mousePosition());

    if ( input.keyPressed('1') ) {
      debugTileOverlay = !debugTileOverlay;
      map.clearChunks();
    } else if ( input.keyPressed('2') ) {
      debugChunkOverlay = !debugChunkOverlay;
      map.clearChunks();
    } else if ( input.keyPressed('3') ) {
      debugOverlay = !debugOverlay;
    } else if ( input.keyPressed('7') ) {
      cheatMode = !cheatMode;
    } else if ( input.keyPressed('8') ) {
      debugDetail = !debugDetail;
      map.clearChunks();
    } else if ( input.keyPressed('9') ) {
      Game.UI.toggle();
    }

    map.tick(timeSinceLastFrame); // Last

    Game.UI.update({
      player: player.getUIData(),
      opts : {
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  Game.Scene = {
    create : CreateScene,
    render : RenderScene,
    destroy: DestroyScene,
    resize : ResizeScene
  };

})();

