var chai = require('chai');
var converter = require('../../terrain-rgb-converter');
var fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

describe("Terrain-RGB to 16 bit greyscale conversion", function() {
    it("Should convert a 256x256 Terrain-RGB PNG to 16 bit", function(done) {
        let inputPath = "./test/input256x256.png";
        let outputPath = "./test/output256x256.png";
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
        let inputPath = "./test/input512x512.png";
        let outputPath = "./test/output512x512.png";
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.convert(inputPath, outputPath, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(stats.size).to.equal(27979);
            done();
        });
    });

    it("Should retrieve a valid 256x256 Terrain-RGB tile from a server", function(done) {
        
        //Will fail if you do not have a .env file in the root of your project with an entry: MAPBOX_TOKEN=<your token>. 
        //Not recommended to track this file in source control.
        chai.expect(process.env.MAPBOX_TOKEN);

        //Whiteface Mountain area, NY
        let url = "https://api.mapbox.com/v4/mapbox.terrain-rgb/12/1207/1483.pngraw?access_token=" + process.env.MAPBOX_TOKEN;
        let outputPath = "./test/retrievedTile.png";
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        converter.getTile(url, outputPath, function() {
            var stats = fs.statSync(outputPath);
            chai.expect(fs.existsSync(outputPath));
            done();
        });
    });

});