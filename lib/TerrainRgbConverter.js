var PNG = require('pngjs').PNG;
var fs = require('fs');
var events = require('events');
var request = require('request');

var SCALE_16_BIT = 65535;
var SCALE_8_BIT = 255;

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG.
 * @param options {Object} Options for the conversion.
 * @param callback {Function} The path to save the 16 bit PNG.
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
 * @param callback {Function} The path to save the 16 bit PNG.
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

/* Converts a Terrain-RGB PNG to a 16 bit greyscale PNG depicting slope percentage.
 * @param options {Object} Options for the conversion.
 * @param callback {Function} The path to save the 16 bit PNG.
*/
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
                    
                    //obtain the pixel for which we will caclulate slope and its neighboring pixels
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
                    //var height = getHeightFromRgb(r, g, b);
                    var northHeight = getHeightFromRgb(rNorth, gNorth, bNorth);
                    var northeastHeight = getHeightFromRgb(rNortheast, gNortheast, bNortheast);
                    var eastHeight = getHeightFromRgb(rEast, gEast, bEast);
                    var southeastHeight = getHeightFromRgb(rSoutheast, gSoutheast, bSoutheast);
                    var southHeight = getHeightFromRgb(rSouth, gSouth, bSouth);
                    var southwestHeight = getHeightFromRgb(rSouthwest, gSouthwest, bSouthwest);
                    var westHeight = getHeightFromRgb(rWest, gWest, bWest);
                    var northwestHeight = getHeightFromRgb(rNorthwest, gNorthwest, bNorthwest);

                    //scale all values to full range of 16 bit
                    if (options.scaleValues) {
                        var scale = SCALE_16_BIT / statsRange;
                        var offset = -1 * (stats.minHeight * scale);
                        height = scale * height + offset;
                        northHeight = scale * northHeight + offset;
                        northeastHeight = scale * northeastHeight + offset;
                        eastHeight = scale * eastHeight + offset;
                        southeastHeight = scale * southeastHeight + offset;
                        southHeight = scale * southHeight + offset;
                        southwestHeight = scale * southwestHeight + offset;
                        westHeight = scale * westHeight + offset;
                        northwestHeight = scale * northwestHeight + offset;
                    }

                    //calculate slope using its 8 neighbors
                    var dzdx;
                    var dzdy;
                    //Handle edge cases. Badly. TODO: Fix this later.
                    if(x === 0 && y === 0) {
                        //northwest corner...
                        dzdx = ((eastHeight + (2 * eastHeight) + southeastHeight) - (eastHeight + (2 * eastHeight) + eastHeight));
                        dzdy = ((southHeight + (2 * southHeight) + southeastHeight) - (eastHeight + (2* southHeight) + eastHeight));
                    }
                    else if (x === 511 && y === 0) {
                        //northeast corner...
                        dzdx = ((westHeight + (2 * westHeight) + southHeight) - (westHeight + (2 * westHeight) + southwestHeight));
                        dzdy = ((southwestHeight + (2 * southHeight) + southHeight) - (southwestHeight + (2* southHeight) + southHeight));
                    }
                    else if (x === 0 && y === 511) {
                        //southwest...
                        dzdx = ((northeastHeight + (2 * eastHeight) + eastHeight) - (northHeight + (2 * eastHeight) + eastHeight));
                        dzdy = ((northHeight + (2 * northHeight) + eastHeight) - (northHeight + (2* northHeight) + northeastHeight));
                    }
                    else if (x === 511 && y === 511) {
                        //southeast...
                        dzdx = ((northHeight + (2 * westHeight) + northHeight) - (northwestHeight + (2 * westHeight) + northHeight));
                        dzdy = ((westHeight + (2 * northHeight) + westHeight) - (northwestHeight + (2 * northHeight) + northHeight));
                    }
                    else if (x === 0) {
                        //left edge...
                        dzdx = ((northeastHeight + (2 * eastHeight) + southeastHeight) - (northHeight + (2 * eastHeight) + southHeight));
                        dzdy = ((southHeight + (2 * southHeight) + southeastHeight) - (northHeight + (2* northHeight) + northeastHeight));
                    }
                    else if (x === 511) {
                        //right edge
                        dzdx = ((northHeight + (2 * westHeight) + southHeight) - (northwestHeight + (2 * westHeight) + southwestHeight));
                        dzdy = ((southwestHeight + (2 * southHeight) + southHeight) - (northwestHeight + (2* northHeight) + northHeight));
                    }
                    else if (y === 0) {
                        //top edge...
                        dzdx = ((southeastHeight + (2 * eastHeight) + southeastHeight) - (westHeight + (2 * westHeight) + southwestHeight));
                        dzdy = ((southwestHeight + (2 * southHeight) + southeastHeight) - (westHeight + (2* southHeight) + southeastHeight));
                    }
                    else if (y === 511) {
                        //bottom edge
                        dzdx = ((northeastHeight + (2 * eastHeight) + eastHeight) - (northwestHeight + (2 * westHeight) + westHeight));
                        dzdy = ((westHeight + (2 * northHeight) + eastHeight) - (northwestHeight + (2* northHeight) + northeastHeight));
                    }
                    else {
                        dzdx = ((northeastHeight + (2 * eastHeight) + southeastHeight) - (northwestHeight + (2 * westHeight) + southwestHeight));
                        dzdy = ((southwestHeight + (2 * southHeight) + southeastHeight) - (northwestHeight + (2* northHeight) + northeastHeight));
                    }

                    var riseRun = Math.sqrt(Math.pow(dzdx, 2) + Math.pow(dzdy, 2));
                    var slopeDegrees = Math.atan(riseRun) * 57.29578;
                    /*
                    if (isNaN(slopeDegrees)) {
                        console.log("NaN at: " + x + ", " + y);
                    }
                    */
                    bitmap[y * w + x] = slopeDegrees;
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
