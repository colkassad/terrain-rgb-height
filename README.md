# terrain-rgb-converter
Converts Mapbox's [Terrain-RGB](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/) PNG tiles to 16 bit greyscale PNGs

# Installation

`npm install terrain-rgb-converter`


# Example
```javascript
var converter = require('terrain-rgb-converter');

converter.convert('/path/to/my/terrain-rgb-tile.png', '/path/to/output/16bit.png', function() {
  console.log("Finished.");
});
```
