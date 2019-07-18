# terrain-rgb-converter
Converts Mapbox's Terrain-RGB PNG tiles to 16 bit greyscale PNGs

# Installation

`npm install terrain-rgb-converter`


# Example
```javascript
var converter = require('terrain-rgb-converter');

converter.convert('/path/to/my/terrain-rgb-tile.png', '/path/to/output/16bit.png', function() {
  console.log("Finished.");
});
```
