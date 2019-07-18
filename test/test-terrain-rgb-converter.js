var chai = require('chai');
var converter = require('../../terrain-rgb-converter');
var fs = require('fs');

describe("Terrain-RGB to 16 bit greyscale conversion", function() {
    it("Should convert a 256x256 Terrain-RGB PNG to 16 bit", function(done) {
        let inputPath = './test/input256x256.png';
        let outputPath = './test/output256x256.png';
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.convert(inputPath, outputPath, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(28165);
            done();
        });
    });

    it("Should convert a 512x512 Terrain-RGB PNG to 16 bit", function(done) {
        let inputPath = './test/input512x512.png';
        let outputPath = './test/output512x512.png';
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.convert(inputPath, outputPath, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(27979);
            done();
        });
    });
});