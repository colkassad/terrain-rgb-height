var PNG = require('pngjs').PNG;
var fs = require('fs');
var events = require('events');
var request = require('request');

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG.
 * @param inputFilePath {String} A valid path to a Terrain-RGB PNG.
 * @param outputFilePath {String} The path to save the 16 bit PNG.
*/
module.exports.convert = function(inputFilePath, outputFilePath, callback) {
    var eventEmitter = new events.EventEmitter();
    eventEmitter.on('converted', callback);
    fs.createReadStream(inputFilePath)
        .pipe(new PNG({
        }))
        .on('parsed', function() {
            
            var w = this.width;
            var h = this.height;

            var buffer = Buffer.alloc(2 * w * h);
            var bitmap = new Uint16Array(buffer.buffer);
            
            //extract elevations
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    
                    var idx = (w * y + x) << 2;
                    
                    var r = this.data[idx];
                    var g  = this.data[idx + 1];
                    var b = this.data[idx + 2];
    
                    //convert from terrain-rgb to integer height value
                    var height = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);

                    //hack to avoid overflow pixels 
                    //TODO: see if I can figure out a 
                    //way to handle negative elevations
                    if (height < 0) {
                        height = 0;
                    }
                    bitmap[y * w + x] = height;
                }
            }

            //write out a 16 bit png
            png = new PNG({
                width: w,
                height: h,
                bitDepth: 16,
                colorType: 0,
                inputColorType: 0,
                inputHasAlpha: false
            });
            png.data = bitmap;
            png.pack().pipe(fs.createWriteStream(outputFilePath)
                .on('close', function() {
                    eventEmitter.emit('converted');
                }));
    })
    .on('error', function(err) {
        console.log(err);
    });; 
};

/* Obtains a Terrain-RGB PNG from a server.
 * @param url {String} The URL to the Terrain-RGB tile.
 * @param outputFilePath {String} The path to save the Terrain-RGB tile.
 * @param callback {Function} The callback for when the request is completed.
*/
module.exports.getTile = function(url, outputFilePath, callback) {
    request.head(url, function(err, res, body) {
        request(url)
        .pipe(fs.createWriteStream(outputFilePath, res.data)
        .on('close', callback));
    })
};