var chai = require('chai');
var converter = require('../../terrain-rgb-converter');
var fs = require('fs');

describe("Terrain-RGB Tests", function() {
    it("Should convert a 256x256 Terrain-RGB PNG to 16 bit", function(done) {
        let inputPath = "./test/input256x256.png";
        let outputPath = "./test/output256x256.png";
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        var options = { 
            'inputFilePath' : inputPath, 
            'outputFilePath' : outputPath 
        };
        converter.convert(options, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(28007);
            done();
        });
    });

    it("Should convert a 512x512 Terrain-RGB PNG to 16 bit", function(done) {
        let inputPath = "./test/input512x512.png";
        let outputPath = "./test/output512x512.png";
        var options = { inputFilePath : inputPath, outputFilePath : outputPath };
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.convert(options, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(26090);
            done();
        });
    });

    it("Should retrieve a valid 256x256 Terrain-RGB tile from a server", function(done) {
        //Whiteface Mountain area, NY
        let url = "https://api.mapbox.com/v4/mapbox.terrain-rgb/12/1207/1483.pngraw?access_token=" + "pk.eyJ1Ijoic2hhbmUwMjIwNzIiLCJhIjoiY2p5aHg0b3YxMDRlODNubWpldmFvYjNuMCJ9.VImPh4Yak9vR2avBEJ2N_Q";
        let outputPath = "./test/outputGetTile.png";
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.getTile(url, outputPath, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(137508);
            done();
        });
    });

    it("Should scale pixel values properly", function(done) {
        let inputPath = "./test/input512x512.png";
        let outputPathScaled = "./test/outputScaled512x512.png";
        if (fs.existsSync(outputPathScaled)) {
            fs.unlinkSync(outputPathScaled);
        }
        var options = { inputFilePath: inputPath, outputFilePath : outputPathScaled, scaleValues: true };
        converter.convert(options, function() {
            var fileStats = fs.statSync(outputPathScaled);
            chai.expect(fileStats.size).to.equal(88838);
            done();
        });
    });

    it("Should convert to 32 bit properly", function(done) {
        let inputPath = "./test/input512x512.png";
        let outputPath32 = "./test/output32bit.png";
        if (fs.existsSync(outputPath32)) {
            fs.unlinkSync(outputPath32);
        }
        var options = { inputFilePath: inputPath, outputFilePath : outputPath32 };
        converter.convert32(options, function() {
            var fileStats = fs.statSync(outputPath32);
            chai.expect(fileStats.size).to.equal(43326);
            done();
        });
    });

    it("Should calculate statistics properly", function(done) {
        let inputPath = "./test/input512x512.png";
        converter.calculateStatistics(inputPath, function(stats) {
            chai.expect(Math.floor(stats.minHeight)).to.equal(946);
            chai.expect(Math.floor(stats.maxHeight)).to.equal(1233);
            done();
        });
    });

    it("Should calculate slope properly", function(done) {
        var options  = {
            inputFilePath: './test/input3x3.png',
            outputFilePath: './outputSlope3x3.png',
            cellsize: 5
        };
        converter.convertToSlope(options, function() {
            var fileStats = fs.statSync(options.outputFilePath);
            chai.expect(fileStats.size).to.equal(96);
            done();
        });
            
            
    });
});