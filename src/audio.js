/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  var audio_supported   = false;//!!document.createElement('audio').canPlayType   ? document.createElement('audio')   : null;
  var SUPPORT_AUDIO     = (!!audio_supported);
  var SUPPORT_AUDIO_OGG = (audio_supported && !!audio_supported.canPlayType('audio/ogg; codecs="vorbis'));
  var SUPPORT_AUDIO_MP3 = (audio_supported && !!audio_supported.canPlayType('audio/mpeg'));
  var SUPPORT_AUDIO_WAV = (audio_supported && !!audio_supported.canPlayType('audio/wav; codecs="1"'));

  var AudioHandler = function() {
    var format = null;
    if ( SUPPORT_AUDIO ) {
      format = SUPPORT_AUDIO_OGG ? 'ogg' : (SUPPORT_AUDIO_MP3 ? 'mp3' : (SUPPORT_AUDIO_WAV ? 'wav' : null));
    }

    this.enabled = format !== null;
    this.format  = format;
    this.sounds  = {};
    this.songs   = {};
    this.song    = null;
    this.volume  = {
      sfx     : 1.0,
      ambient : 0.4,
      music   : 0.5
    };

    if ( !this.enabled ) console.warn('Audio not enabled :-(');
  };

  AudioHandler.prototype.SCREEN_MAIN = 0;
  AudioHandler.prototype.SCREEN_GAME = 1;

  AudioHandler.prototype.init = function(engine) {
    console.group("AudioHandler::init()", "AudioHandler handling initialized");
    console.log("Supported", SUPPORT_AUDIO);
    console.log("Enabled", this.enabled);
    console.log("Format", this.format);
    console.groupEnd();
  };

  AudioHandler.prototype.load = function(sounds, callback) {
    if ( this.enabled ) {
      var lib = {};

      var i, s, a, fn;
      for ( i in sounds ) {
        if ( sounds.hasOwnProperty(i) ) {
          fn = sounds[i].src + '.' + this.format;
          console.log('AudioHandler::load()', 'Adding sound', i, fn);

          a = new Audio(fn);

          /*a.addEventListener('canplaythrough', function(ev){
            console.info('---', 'loaded audio async', this);
          }, false );*/

          a.preload = 'auto';
          a.load();

          lib[i] = {
            clip : a,
            src  : fn,
            opts : sounds[i]
          };
        }
      }

      this.sounds = lib;
    }

    callback(true); // Async
  };

  AudioHandler.prototype.destroy = function(engine) {
  };

  AudioHandler.prototype.update = function() {
  };

  AudioHandler.prototype.play = function(snd, ambient) {
    if ( !this.sounds[snd] ) return false;

    var a = this.sounds[snd].clip.cloneNode(true);
    a.currentTime = 0;
    a.volume = ambient ? this.volume.ambient : this.volume.sfx;
    a.play();

    return true;
  };

  AudioHandler.prototype.musicAction = function(act) {
    switch ( act ) {
      case 'pause' :
        if ( this.song ) this.song.stop();
      break;
      case 'start' :
        if ( this.song ) this.song.play();
      break;
      case 'stop' :
        if ( this.song ) { this.song.stop(); this.song.currentTime = 0; }
      break;
      case 'next' :
      break;
      case 'prev' :
      break;

      default :
        if ( this.songs[act] ) {
          this.song.src = this.songs[act];
          this.song.volume = this.volume.music;
          this.song.currentTime = 0;
          this.song.play();
        }
      break;
    }
  };

  AudioHandler.prototype.setVolume = function(m, v) {
    this.volume[m] = v;

    if ( this.song ) this.song.volume = this.volume.music;
  };

  Game.Audio = new AudioHandler();

})();

