const { PNG } = require('pngjs');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');

const pipelineAsync = promisify(pipeline);

const SCALE_16_BIT = 65535;
const SCALE_8_BIT = 255;

// Converts a Terrain-RGB PNG to a 16 bit greyscale PNG.
module.exports.convert = (options = {}, callback) => {
    fs.createReadStream(options.inputFilePath)
        .pipe(new PNG({}))
        .on('parsed', function () {
            const w = this.width;
            const h = this.height;

            const buffer = Buffer.alloc(2 * w * h);
            const bitmap = new Uint16Array(buffer.buffer);

            let stats;
            let statsRange;
            if (options.scaleValues) {
                stats = getStatistics(this);
                statsRange = stats.maxHeight - stats.minHeight;
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (w * y + x) << 2;
                    const r = this.data[idx];
                    const g = this.data[idx + 1];
                    const b = this.data[idx + 2];

                    let height = getHeightFromRgb(r, g, b);
                    if (options.scaleValues) {
                        const scale = SCALE_16_BIT / statsRange;
                        const offset = -1 * (stats.minHeight * scale);
                        height = scale * height + offset;
                    }

                    if (height < 0) {
                        height = 0;
                    }
                    bitmap[y * w + x] = height;
                }
            }

            const png = new PNG({
                width: w,
                height: h,
                bitDepth: 16,
                colorType: 0,
                inputColorType: 0,
                inputHasAlpha: false
            });
            png.data = bitmap;
            png.pack().pipe(fs.createWriteStream(options.outputFilePath)
                .on('close', () => callback()));
        })
        .on('error', err => {
            console.log(err);
        });
};

// Converts a Terrain-RGB PNG to a 32 bit RGB image depicting height as grey values from 0 to 255.
module.exports.convert32 = (options = {}, callback) => {
    fs.createReadStream(options.inputFilePath)
        .pipe(new PNG({}))
        .on('parsed', function () {
            const w = this.width;
            const h = this.height;
            const stats = getStatistics(this);
            const statsRange = stats.maxHeight - stats.minHeight;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (w * y + x) << 2;
                    const r = this.data[idx];
                    const g = this.data[idx + 1];
                    const b = this.data[idx + 2];

                    let height = getHeightFromRgb(r, g, b);
                    const scale = SCALE_8_BIT / statsRange;
                    const offset = -1 * (stats.minHeight * scale);
                    height = scale * height + offset;

                    if (height < 0) {
                        height = 0;
                    }
                    this.data[idx] = height;
                    this.data[idx + 1] = height;
                    this.data[idx + 2] = height;
                }
            }
            this.pack().pipe(fs.createWriteStream(options.outputFilePath)
                .on('close', () => callback()));
        })
        .on('error', err => {
            console.log(err);
        });
};

// converts height encoded in RGB values to a 16 bit integer elevation
const getHeightFromRgb = (r, g, b) => -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);

// Obtains a Terrain-RGB PNG from a server.
module.exports.getTile = async (url, outputFilePath, callback) => {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Unexpected response ${res.status}`);
        }
        await pipelineAsync(res.body, fs.createWriteStream(outputFilePath));
        if (callback) callback();
    } catch (err) {
        if (callback) return callback(err);
        throw err;
    }
};

// Calculates the minimum and maximum values of a PNG file.
module.exports.calculateStatistics = (inputFilePath, callback) => {
    fs.createReadStream(inputFilePath)
        .pipe(new PNG({}))
        .on('parsed', function () {
            callback(getStatistics(this));
        })
        .on('error', err => {
            console.log(err);
        });
};

// Calculates the minimum and maximum values of a PNG.
const getStatistics = png => {
    const stats = {};
    stats.minHeight = Number.MAX_VALUE;
    stats.maxHeight = Number.MIN_VALUE;
    const h = png.height;
    const w = png.width;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (w * y + x) << 2;
            const r = png.data[idx];
            const g = png.data[idx + 1];
            const b = png.data[idx + 2];
            const height = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
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
