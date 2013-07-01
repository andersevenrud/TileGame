/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  /**
   * @class
   */
  var Simplex = function(seed) {
    var list = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,
      103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,
      26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,
      87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,
      46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,
      187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,
      198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,
      255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,
      170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,
      9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
      218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
      81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,
      84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,
      67,29,24,72,243,141,128,195,78,66,215,61,156,180];

    var _simple = function() {
      var i = 0, l = list.length, field;
      var p = [];
      for(i; i < l; i++) {
        field = list[i];
        p[i] = field;
        p[256 + i] = field;
      }

      return p;
    };

    var _seeded = function() {
      var s = new Seeder(seed);
      var p = [];

      var lst = list, i, k, l;

      for ( i = 0; i < 256; i++ ) {
        lst[i] = i;
      }

      for ( i = 0; i < 256; i++ ) {
        k = s.randomIntRange(0, 256 - i) + i;
        l = lst[i];
        lst[i] = lst[k];
        lst[k] = l;
        lst[i + 256] = lst[i];
      }

      for(i = 0; i < 256; i++) {
        p[256 + i] = p[i] = lst[i];
      }

      return p;
    };


    this.p = seed ? _seeded() : _simple();
  };

  Simplex.prototype.lerp = function(t, a, b) {
    return a + t * (b - a);
  };

  Simplex.prototype.fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  Simplex.prototype.grad = function(hash,x,y,z) {
    var h = hash & 15;
    var u = h < 8 ? x : y;
    var v = h < 4 ? y : h == 12 || h == 14 ? x : z;

    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  };

  Simplex.prototype.snoise = function(x,y,z) {
    var floopX = Math.floor(x) & 255;
    var floopY = Math.floor(y) & 255;
    var floopZ = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    var u = this.fade(x);
    var v = this.fade(y);
    var w = this.fade(z);

    var a = this.p[floopX] + floopY;
    var aa = this.p[a] + floopZ;
    var ab = this.p[a + 1] + floopZ;
    var b = this.p[floopX + 1] + floopY;
    var ba = this.p[b] + floopZ;
    var bb = this.p[b + 1] + floopZ;

    var pAA = this.p[aa];
    var pAB = this.p[ab];
    var pBA = this.p[ba];
    var pBB = this.p[bb];
    var pAA1 = this.p[aa + 1];
    var pAB1 = this.p[ab + 1];
    var pBA1 = this.p[ba + 1];
    var pBB1 = this.p[bb + 1];

    var gradAA = this.grad(pAA,x,y,z);
    var gradBA = this.grad(pBA, x-1,y,z);
    var gradAB = this.grad(pAB,x,y-1,z);
    var gradBB = this.grad(pBB,x-1,y-1,z);
    var gradAA1 = this.grad(pAA1,x,y,z-1);
    var gradBA1 = this.grad(pBA1,x-1,y,z-1);
    var gradAB1 = this.grad(pAB1,x,y-1,z-1);
    var gradBB1 = this.grad(pBB1,x-1,y-1,z-1);

    return this.lerp(w,
      this.lerp(v, this.lerp(u, gradAA, gradBA), this.lerp(u, gradAB, gradBB)),
      this.lerp(v, this.lerp(u, gradAA1, gradBA1), this.lerp(u,gradAB1,gradBB1))
     );
  };


  /**
   * @class
   */
  function Seeder(seed) {
    this.seed = seed;
  }

  Seeder.prototype.randomInt = function() {
    return this.gen();
  };

  Seeder.prototype.random = function() {
    return ( this.gen() / 2147483647 );
  };

  Seeder.prototype.randomIntRange = function(min, max) {
    min -= .4999;
    max += .4999;
    return Math.round(min + ((max - min) * this.random()));
  };

  Seeder.prototype.randomRange = function(min, max) {
    return min + ((max - min) * this.random());
  };

  Seeder.prototype.gen = function() {
    return this.seed = (this.seed * 16807) % 2147483647;
  };

  //
  // Exports
  //
  Game.SimplexNoise = Simplex;

})();

