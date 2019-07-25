var PNG = require('pngjs').PNG;
var fs = require('fs');
var events = require('events');
var request = require('request');

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG.
 * @param inputFilePath {String} A valid path to a Terrain-RGB PNG.
 * @param outputFilePath {String} The path to save the 16 bit PNG.
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
                console.log("Scaling height values for the Unreal Engine.");
                console.log("Minimum Height: " + Math.round(stats.minHeight * 100) / 100);
                console.log("Maximum Height: " + Math.round(stats.maxHeight * 100) / 100);
                console.log("Elevation range is: " + Math.round(statsRange * 100) / 100);
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

                    if (options.scaleValues) {
                        var scale = 32767 / statsRange;
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

module.exports.convertToSlope = function(options, callback) {
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
                console.log("Scaling height values for the Unreal Engine.");
                console.log("Minimum Height: " + Math.round(stats.minHeight * 100) / 100);
                console.log("Maximum Height: " + Math.round(stats.maxHeight * 100) / 100);
                console.log("Elevation range is: " + Math.round(statsRange * 100) / 100);
            }
            //extract elevations
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    
                    var idx = (w * y + x) << 2;

                    var northIdx = (w * (y - 1) + x) << 2;
                    var northeastIdx = (w * (y - 1) + (x + 1)) << 2;
                    var eastIdx = (w * y + (x + 1)) << 2;
                    var southeastIdx = (w * (y + 1) + (x + 1)) << 2;
                    var southIdx = (w * (y + 1) + x) << 2;
                    var southwestIdx = (w * (y + 1) + (x - 1)) << 2;
                    var westIdx = (w * y + (x - 1)) << 2;
                    var northwestIdx = (w * (y - 1) + (x - 1)) << 2;
                    
                    var r = this.data[idx];
                    var g  = this.data[idx + 1];
                    var b = this.data[idx + 2];

                    var rNorth = this.data[northIdx];
                    var gNorth = this.data[northIdx + 1];
                    var bNorth = this.data[northIdx + 2];

                    var rNortheast = this.data[northeastIdx];
                    var gNortheast = this.data[northeastIdx + 1];
                    var bNortheast = this.data[northeastIdx + 2];

                    var rEast = this.data[eastIdx];
                    var gEast = this.data[eastIdx + 1];
                    var bEast = this.data[eastIdx + 2];

                    var rSoutheast = this.data[southeastIdx];
                    var gSoutheast = this.data[southeastIdx + 1];
                    var bSoutheast = this.data[southeastIdx + 2];

                    var rSouth = this.data[southIdx];
                    var gSouth = this.data[southIdx + 1];
                    var bSouth = this.data[southIdx + 2];

                    var rSouthwest = this.data[southwestIdx];
                    var gSouthwest = this.data[southwestIdx + 1];
                    var bSouthwest = this.data[southwestIdx + 2];

                    var rWest = this.data[westIdx];
                    var gWest = this.data[westIdx + 1];
                    var bWest = this.data[westIdx + 2];

                    var rNorthwest = this.data[northwestIdx];
                    var gNorthwest = this.data[northwestIdx + 1];
                    var bNorthwest = this.data[northwestIdx + 2];

                
                    //convert from terrain-rgb to integer height value
                    var height = getHeightFromRgb(r, g, b);
                    var northHeight = getHeightFromRgb(rNorth, gNorth, bNorth);
                    var northeastHeight = getHeightFromRgb(rNortheast, gNortheast, bNortheast);
                    var eastHeight = getHeightFromRgb(rEast, gEast, bEast);
                    var southeastHeight = getHeightFromRgb(rSoutheast, gSoutheast, bSoutheast);
                    var southHeight = getHeightFromRgb(rSouth, gSouth, bSouth);
                    var southwestHeight = getHeightFromRgb(rSouthwest, gSouthwest, bSouthwest);
                    var westHeight = getHeightFromRgb(rWest, gWest, bWest);
                    var northwestHeight = getHeightFromRgb(rNorthwest, gNorthwest, bNorthwest);
/*
                    console.log("Height: " + height);
                    console.log("North: " + northHeight);
                    console.log("South: " + southHeight);
                    console.log("East: " + eastHeight);
                    console.log("West: " + westHeight);
*/
                    if (options.scaleValues) {
                        var scale = 32767 / statsRange;
                        var offset = -1 * (stats.minHeight * scale);
                        height = scale * height + offset;
                    }

                    //north-south slope...
                    var eastWestSlope = Math.abs((northwestHeight + (westHeight * 2) + southwestHeight) - (northeastHeight + (eastHeight * 2) + southeastHeight));
                    var northSouthSlope = Math.abs((northwestHeight + (northHeight * 2) + northeastHeight) - (southwestHeight + (southHeight * 2) + southeastHeight));

                    var slope = Math.sqrt(Math.pow(eastWestSlope, 2) + Math.pow(northSouthSlope, 2)) * 100;

                    bitmap[y * w + x] = slope;
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
