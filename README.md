# terrain-rgb-converter
Converts Mapbox's [Terrain-RGB](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/) PNG tiles to 16 bit greyscale PNGs

# Installation

`npm install terrain-rgb-converter`


# Examples
```javascript
var converter = require('terrain-rgb-converter');

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
var converter = require('terrain-rgb-converter');

var options = {
  inputFilePath: '/path/to/my/terrain-rgb-tile.png',
  outputFilePath: '/path/to/output/16bit.png',
  scaleValues: true
};

converter.convert(options, function() {
  console.log("Finished.");
});
```