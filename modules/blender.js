const express       = require("express");
const { execFile }  = require("node:child_process");
const { spawn }     = require("node:child_process");
const path          = require("node:path");

let rendered_image_data = {};

module.exports = {

    // Command Line Arguments for rendering:
    // blender -b d:\temp\scenes\ball.blend -o d:\temp\scenes\ball_####.png --render-frame 1 --render-format PNG --engine CYCLES

    getBlenderFileInformation: async function( _res, _file, _cfg, _ld ) {

        // console.log("getBlenderFileInformation");
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

    render: async function( _req, _res, _c, _ld ) {

        console.log("Blender::render - File : " + _req.query.file );

        console.log( _c );
        console.log( _ld );

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

            /*
            Fra:1 Mem:279.83M (Peak 409.49M) | Time:00:28.33 | Remaining:00:00.43 | Mem:593.14M, Peak:593.14M | Scene, ViewLayer | Sample 1008/1024
            Fra:1 Mem:343.11M (Peak 438.04M) | Time:00:31.72 | Mem:593.14M, Peak:593.14M | Scene, ViewLayer | Sample 1024/1024
            Fra:1 Mem:343.11M (Peak 438.04M) | Time:00:31.72 | Mem:593.14M, Peak:593.14M | Scene, ViewLayer | Finished
            Saved: 'd:\temp\scenes\ball_0001.png'
            Time: 00:32.16 (Saving: 00:00.36)
            */

            switch( data.toString().substring(0,3) ) {
                case "Fra" :

                    let _juice = data.toString().split("|");

                    rendered_image_data.frame = _juice[0].substring(4);
                    rendered_image_data.time = _juice[1];

                    let _i_fix = 0;
                    if( _juice.length == 6) _i_fix = 1;


                    rendered_image_data.samples = _juice[ 4 + _i_fix ];
                    rendered_image_data.scene   = _juice[ 3 + _i_fix ];
                    rendered_image_data.memory  = _juice[ 2 + _i_fix ];
                    
                    rendered_image_data.remaining = _juice[ 2 ];

                    _res.send( rendered_image_data );
                    
                    // console.log( data.toString() );
                    break;
                case "Sav" :
                    rendered_image_data.file = data.toString();
                    // console.log( data.toString() );
                    break;
                case "Tim" :
                    rendered_image_data.time = data.toString();
                    break;
                default :
                    console.log( data.toString() );
                    break;
            }

            // console.log(`stdout: ${data}`);
        });

        _br.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        _br.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
          }); 

    }

}