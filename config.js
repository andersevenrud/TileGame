/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  Game.Config = {
    Player : {
      sx  : 19.666,
      sy  : 32,
      rot : 90
    },

    Textures : {
      terrain : {
        src : 'gfx/terrain.png',
        sx  : 32,
        sy  : 32,
        ids : ['water', 'grass', 'dirt', 'sand', 'gravel', 'stone', 'lava', 'desert']
      },

      player : {
        src       : 'gfx/player.png',
        sx        : 19.666,
        sy        : 32,
        ids       : ['idle'],
        animations: {
          walk : {
            frames    : [0, 5],
            duration  : 100
          },
          run : {
            frames    : [0, 5],
            duration  : 50
          }
        }
      },

      trees : {
        src     : 'gfx/trees.png',
        sx      : 66,
        sy      : 70,
        cx      : 33,
        cy      : 65,
        ids     : ['palm']
      }
    },

    Weapons : [
      {
        name   : 'Pistol',
        ammo   : 1000000,
        bullet : {
          w     : 4,
          h     : 4,
          speed : 50,
          life  : 2000,
          color : "#ff0000"
        }
      },
      {
        name   : 'Rifle',
        ammo   : 1000000,
        bullet : {
          w     : 3,
          h     : 3,
          speed : 80,
          life  : 3000,
          color : "#0000ff"
        }
      }
    ],

    Sounds : {
      walkSand : {
        src     : 'walk_sand',
        speed   : 1.0
      },
      runSand  : {
        src     : 'walk_sand',
        speed   : 2.0
      },
      swimWater: {
        src     : 'swim_water',
        speed   : 1.0
      },
      shootPistol : {
        src     : 'shot_pistol',
        speed   : 1.0
      },
      shootRifle : {
        src     : 'shoot_pistol',
        speed   : 2.0
      }
    }
  };

})();

