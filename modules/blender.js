const express       = require("express");
const { execFile }  = require("node:child_process");
const { spawn }     = require("node:child_process");
const path          = require("node:path");
const status_codes  = require("./status_codes.js");

module.exports = {

    render_info: {
        frame: "",
        time: "",
        samples: "",
        scene: "",
        memory: "",
        remaining: "",
        file: ""
    },

    getBlenderFileInformation: async function( _res, _file, _cfg, _ld ) {

        const child = await execFile( _cfg.blender_path, ["-b", path.join( _ld.project_folder, _file ), "--python", path.join( _ld.root_folder, "smoothie.py")], (error, stdout, stderr) => {
            if (error) {
                console.log(error);
            }
            let _juice = stdout.split("§§§§§");
            if( _juice.length >= 2 ) {
                let _info = JSON.parse( _juice[1]);
                _info.filename = _file; // Add the filename to the JSON
                console.log("FILE INFO : (parsed json)");
                console.log(_info);
                _res.send( _info );
            } else {
                _res.send( '{ "ERROR" : "Blender Returned nothing?" }' );
            }
        });
    },

    getBlenderVersion: async function( _res, _cfg ) {

        console.log('\x1b[32m%s\x1b[0m', 'Blender::getBlenderVersion');
        const child = execFile( _cfg.blender_path, ["-v"], (error, stdout, stderr) => {
            if (error) { throw error; }
            let _version = stdout.split("\n").shift().trim();
            console.log("In Case You Didn't Know, Your Blender Version, it's " + _version);
            _res.send({ data: _version });
            return _version;
        });
    },

    getRenderInfo: function() {
        return this.render_info;
    },

    render: async function( _req, _res, _c, _ld, _gui ) {

        // Set Node State to RENDERING
        _gui( status_codes.RENDERING );

        // console.log("Blender::render - File : " + _req.query.file );
        this.render_info = {
            file: _req.query.file,
        };
        let fixed_file_name = _req.query.file.replace( ".blend", "" );
        const _br = spawn(
            _c.blender_path,
            [
                "-b",
                path.join( _ld.project_folder, _req.query.file ),
                "-o",
                path.join( _ld.temp_media, fixed_file_name + "_####.png" ),
                "--render-frame",
                "1",
                "--render-format",
                "PNG",
                "--engine",
                "CYCLES"
            ]
        );

        _br.stdout.on('data', (data) => {

            
            switch( data.toString().substring(0,3) ) {
                case "Fra" :
                    
                    // Get The Juice
                    let _juice = data.toString().split("|");

                    // 'Fra:1 Mem:279.83M (Peak 409.49M) '
                    this.render_info.frame = _juice[0].trim().replace("Fra:","").split(" ")[0];

                    // ' Time:00:28.33 '
                    this.render_info.time = _juice[1].trim().replace("Time:","");

                    // ' Remaining:00:00.43 '
                    if( _juice.length == 6 ) this.render_info.remaining = _juice[2].trim().replace("Remaining:","");
                    else this.render_info.remaining = "00:00.00";

                    // Lenght of the Juice array
                    let _last_juice = _juice.length - 1;

                    // ' Mem:593.14M, Peak:593.14M '
                    this.render_info.memory = _juice[ _last_juice - 2 ].trim();

                    // ' Scene, ViewLayer '
                    this.render_info.scene = _juice[ _last_juice - 1 ].trim();

                    // ' Sample 1008/1024 ' or ' Finished '
                    this.render_info.samples = _juice[ _last_juice ].trim().trim().replace("Sample ","");

                    _gui( status_codes.RENDERING );
                    // console.log( data.toString().trim() );
                    break;
                case "Sav" :
                    // console.log( data.toString().trim() );
                    break;
                case "Tim" :
                    // console.log( data.toString().trim() );
                    break;
                default :
                    // console.log( data.toString() );
                    break;
            }
        });

        _br.stderr.on('data', (data) => {
            _gui( status_codes.ERROR );
            console.log(`stderr: ${data}`);
        });

        _br.on('close', (code) => {
            _gui( status_codes.READY );
            console.log(`Done with code ${code}`);
          }); 
    }
}