var PNG = require('pngjs').PNG;
var fs = require('fs');
var events = require('events');
var request = require('request');

var SCALE_16_BIT = 65535;
var SCALE_8_BIT = 255;

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG.
 * @param options {Object} Options for the conversion.
 * @param callback {Function} The function to call once the conversion is complete.
*/
module.exports.convert = function(options, callback) {
    var eventEmitter = new events.EventEmitter();
    eventEmitter.on('converted', callback);
    options = options || {};
    fs.createReadStream(options.inputFilePath)
        .pipe(new PNG({
        }))
        .on('parsed', function() {
            
            var w = this.width;
            var h = this.height;

            var buffer = Buffer.alloc(2 * w * h);
            var bitmap = new Uint16Array(buffer.buffer);

            var stats;
            var statsRange;
            if (options.scaleValues) {
                stats = getStatistics(this);
                statsRange = stats.maxHeight - stats.minHeight;
            }

            //extract elevations
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    
                    var idx = (w * y + x) << 2;
                    
                    var r = this.data[idx];
                    var g  = this.data[idx + 1];
                    var b = this.data[idx + 2];
                    
                    //convert from terrain-rgb to integer height value
                    var height = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);

                    //if scaleValues is set, scale the value to the range of 16 bit
                    if (options.scaleValues) {
                        var scale = SCALE_16_BIT / statsRange;
                        var offset = -1 * (stats.minHeight * scale);
                        height = scale * height + offset;
                    }
                    
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
            png.pack().pipe(fs.createWriteStream(options.outputFilePath)
                .on('close', function() {
                    eventEmitter.emit('converted');
                }));
    })
    .on('error', function(err) {
        console.log(err);
    });;
};

/* Converts a Terrain-RGB PNG to a 32 bit RGB image depicting height as grey values from 0 to 255.
 * @param options {Object} Options for the conversion.
 * @param callback {Function} The function to call once the conversion is complete.
*/
module.exports.convert32 = function(options, callback) {
    var eventEmitter = new events.EventEmitter();
    eventEmitter.on('converted', callback);
    options = options || {};
    fs.createReadStream(options.inputFilePath)
        .pipe(new PNG({
        }))
        .on('parsed', function() {
            
            var w = this.width;
            var h = this.height;
            var stats = getStatistics(this);
            var statsRange= stats.maxHeight - stats.minHeight;

            //Convert RGB encoded height values to a range from 0 to 255 in all three bands
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    
                    var idx = (w * y + x) << 2;
                    
                    var r = this.data[idx];
                    var g  = this.data[idx + 1];
                    var b = this.data[idx + 2];
                    
                    //convert from terrain-rgb to integer height value
                    var height = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
                    var scale = SCALE_8_BIT / statsRange;
                    var offset = -1 * (stats.minHeight * scale);
                    height = scale * height + offset;
                    
                    //hack to avoid overflow pixels 
                    //TODO: see if I can figure out a 
                    //way to handle negative elevations
                    if (height < 0) {
                        height = 0;
                    }
                    this.data[idx] = height;
                    this.data[idx + 1] = height;
                    this.data[idx + 2] = height;
                }
            }
            this.pack().pipe(fs.createWriteStream(options.outputFilePath)
                .on('close', function() {
                    eventEmitter.emit('converted');
                }));
    })
    .on('error', function(err) {
        console.log(err);
    });;
};

//converts height encoded in RGB values to a 16 bit integer elevation
var getHeightFromRgb = function(r, g, b) {
    return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
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

/* Calculates the minimum and maximum values of a PNG file.
 * @param options {Object} Options for the calculation.
 * @param callback {Function} The function to call after calculation is complete.
*/
module.exports.calculateStatistics = function(inputFilePath, callback) {
    fs.createReadStream(inputFilePath)
        .pipe(new PNG({
        }))
        .on('parsed', function() {
            callback(getStatistics(this));
    })
    .on('error', function(err) {
        console.log(err);
    });;
};

/* Calculates the minimum and maximum values of a PNG.
* @param png {PNG} A pngjs PNG object.
* @returns {Object} An object containing the minimum and maximum height.
*/
var getStatistics = function(png) {
    stats = {};
    stats.minHeight = Number.MAX_VALUE;
    stats.maxHeight = Number.MIN_VALUE;
    var h = png.height;
    var w = png.width;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var idx = (w * y + x) << 2;
            var r = png.data[idx];
            var g  = png.data[idx + 1];
            var b = png.data[idx + 2];
            var height = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
            if (height > stats.maxHeight) {
                stats.maxHeight = height;
            }
            if (height < stats.minHeight) {
                stats.minHeight = height;
            }
        }
    }
    return stats;
};
