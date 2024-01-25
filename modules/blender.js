const express = require("express");
const { execFile } = require("node:child_process");
const path = require("node:path");

module.exports = {

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

    getBlenderVersion: async function( _cfg ) {

        // console.log("getBlenderVersion");
        const child = execFile( _cfg.blender_path, ["-v"], (error, stdout, stderr) => {
            if (error) { throw error; }
            let _version = stdout.split("\n").shift().trim();
            console.log(_version);
            return _version;
        });
    }

}