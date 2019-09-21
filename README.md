# terrain-rgb-height
Converts Mapbox's [Terrain-RGB](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/) PNG tiles to 16 bit greyscale PNG heightmaps. [Online demo](http://www.redshifted.org/) and an example [use case](https://imgur.com/a/ENsZXHN) of importing 16 bit PNGs into Unreal Engine 4.

# Installation

`npm install terrain-rgb-height`


# Examples
```javascript
var converter = require('terrain-rgb-height');

var options = {
  inputFilePath: '/path/to/my/terrain-rgb-tile.png',
  outputFilePath: '/path/to/output/16bit.png'
};

converter.convert(options, function() {
  console.log("Finished.");
});
```

There is an option to scale the 16 bit pixels from 0 to 65535:

```javascript
var converter = require('terrain-rgb-height');

var options = {
  inputFilePath: '/path/to/my/terrain-rgb-tile.png',
  outputFilePath: '/path/to/output/16bit.png',
  scaleValues: true
};

converter.convert(options, function() {
  console.log("Finished.");
});
```
