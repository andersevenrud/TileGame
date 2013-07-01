Top-down 2D tile based game engnine with infinite procedural chunk generation using only browser JavaScript.

**This is just an experiment and not complete in any way**

## Installation
Just clone and open _index.html_ in your browser.

## Compability
Latest _Chrome_ and _Firefox_ works fine (Chrome has better performance)

## Controls
* `W` Forward
* `A` Strafe Left
* `S` Backward
* `D` Strafe Right
* `SHIFT` Hold to run
* `MOUSE` Look around
* `MWHEEL` Change weapon
* `LMB` Shoot/Action

### Debugging controls
* `1` Toggle tile overlay
* `2` Toggle chunk overlay
* `3` Toggle data overlay
* `7` Toggle cheat mode (noclip, speedup, disable stats)
* `8` Toggle metadata and bounding overlays
* `9` Toggle UI

## Configuration

Game config is located in `main.js`

Engine config is located in `config.js`

You can supply these arguments in the URL:
* `seed` Seed string
* `x` Starting X position
* `y` Starting Y position

**Example:** `?seed=foo&x=1000`

## Features
* Infinite 2D procedural tile generation using Perlin and Simplex noise
* Map Generation using seeds
* Chunk/Region based rendering
* Character controls and weapons
* Collision detection
* Animations

You can see it in action on <a href="http://www.youtube.com/watch?v=PRamnpPCHKI">my YouTube channel</a><br />

## TODO
Lots of stuff...
