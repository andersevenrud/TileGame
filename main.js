/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
  }

  window.onload = function() {
    if ( !Game.Engine ) {
      throw "Cannot run: No scripts loaded ?!";
    }

    var x = getQueryVariable('x');
    var y = getQueryVariable('y');

    Game.Engine.initialize().run({
      world : {
        seed      : getQueryVariable('seed') || 'default'
      },

      init : {
        x : x ? (x >> 0) : null,
        y : y ? (y >> 0) : null
      }

    });
  };

})();

