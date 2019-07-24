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

I started this project because I wanted an easy way to import "real-world" terrain into Unreal Engine 4. To facilitate this, there is an option to scale the 16 bit pixels from 0 to 32767. The console will output a scaling factor that can be applied to the landscape Z scale parameter in the Unreal Editor. The scaling is applied in the same manner as described [here](https://terraformpro.com/tutorials/tutorial-1/exporting-gis-data/). This scaling has not proven to be perfect and you may need to play around with the scaling to get it right. I hope to improve this in the future. Below is an example showing the scaling option.

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
