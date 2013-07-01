/*!
 * @package Game
 * @author Anders Evenrud <andersevenrud@gmail.com>
 */
"use strict";

var Game = window.Game || {}; // Namespace

(function() {

  var canvasWidth = 0;
  var canvasHeight = 0;

  var UI = function() {
    this.visible = false;
    this.screen  = 0;
    this.data    = null;
  };

  UI.prototype.SCREEN_MAIN = 0;
  UI.prototype.SCREEN_GAME = 1;

  UI.prototype.init = function(engine) {
    canvasWidth = engine.getCanvasWidth();
    canvasHeight = engine.getCanvasHeight();

    console.log("UI::init()", "UI handling initialized");
  };

  UI.prototype.destroy = function(engine) {
  };

  UI.prototype.render = function(timeSinceLastFrame, engine, input) {
    if ( !this.visible ) return;
    if ( this.screen === this.SCREEN_MAIN ) return;
    if ( !this.data ) return;

    var playerData = this.data.player;

    engine.context.font = "8pt Arial";

    var px = 5;
    var py = canvasHeight - 30;
    var boxX = px + 5;
    var boxY = py + 5;
    var boxW = 295;
    var boxH = 20;
    var lingrad, boxV;


    engine.context.strokeStle = "#000";
    engine.context.lineWidth = "1";
    engine.context.globalAlpha = 0.9;

    boxV = (boxW * ((playerData.health >> 0) / 100));
    lingrad = engine.context.createLinearGradient(boxX, boxY, boxX+boxV, boxY+boxH); //(x0,y0) to (x1,y1)
    lingrad.addColorStop(0, '#3f1616');
    lingrad.addColorStop(1, '#a73b3b');

    engine.context.fillStyle = "#FFF";
    engine.context.fillRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = lingrad;
    engine.context.fillRect(boxX, boxY, boxV, boxH);
    engine.context.strokeRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = "#aaa";
    engine.context.fillText("Health", boxX + 7, boxY + 3);
    engine.context.fillText(playerData.health + "%", boxX + 40, boxY + 3);

    //boxY += 20;
    boxX += boxW + 10;
    boxV = (boxW * ((playerData.stamina >> 0) / 100));
    lingrad = engine.context.createLinearGradient(boxX, boxY, boxX+boxV, boxY+boxH); //(x0,y0) to (x1,y1)
    lingrad.addColorStop(0, '#172a40');
    lingrad.addColorStop(1, '#3a6da5');

    engine.context.fillStyle = "#FFF";
    engine.context.fillRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = lingrad;
    engine.context.fillRect(boxX, boxY, boxV, boxH);
    engine.context.strokeRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = "#aaa";
    engine.context.fillText("Stamina", boxX + 7, boxY + 3);
    engine.context.fillText(playerData.stamina + "%", boxX + 50, boxY + 3);

    //boxY += 20;
    boxX += boxW + 10;
    boxV = (boxW * ((playerData.hunger >> 0) / 100));
    lingrad = engine.context.createLinearGradient(boxX, boxY, boxX+boxV, boxY+boxH); //(x0,y0) to (x1,y1)
    lingrad.addColorStop(0, '#404017');
    lingrad.addColorStop(1, '#a6a73a');

    engine.context.fillStyle = "#FFF";
    engine.context.fillRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = lingrad;
    engine.context.fillRect(boxX, boxY, boxV, boxH);
    engine.context.strokeRect(boxX, boxY, boxW, boxH);
    engine.context.fillStyle = "#aaa";
    engine.context.fillText("Hunger", boxX + 7, boxY + 3);
    engine.context.fillText(playerData.hunger + "%", boxX + 48, boxY + 3);

    //boxY += 30;
    boxX += boxW + 10;
    engine.context.fillStyle = "#FFF";
    engine.context.fillRect(boxX, boxY, (boxW / 2) - 5, 20);
    engine.context.strokeRect(boxX, boxY, (boxW / 2) - 5, 20);
    engine.context.fillRect(boxX + (boxW / 2) + 5, boxY, (boxW / 2) - 5, 20);
    engine.context.strokeRect(boxX + (boxW / 2) + 5, boxY, (boxW / 2) - 5, 20);

    //boxY += 4;
    engine.context.font = "9pt Arial";
    engine.context.fillStyle = "#000";
    engine.context.fillText(playerData.weapon + " (" + playerData.ammo + " bullets)", boxX + 4, boxY + 3);
    engine.context.fillText('None', boxX + (boxW / 2) + 9, boxY + 3);

    engine.context.globalAlpha = 1.0;
  };

  UI.prototype.update = function(data) {
    this.data = data;
  };

  UI.prototype.toggle = function() {
    this.visible = !this.visible;
  };

  UI.prototype.resize = function(engine, w, h) {
    canvasWidth = w;
    canvasHeight = h;
  };

  UI.prototype.setScreen = function(s) {
    this.screen = s;
    this.visible = true;
  };

  Game.UI = new UI();

})();

