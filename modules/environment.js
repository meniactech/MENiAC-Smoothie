const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

 // Navigate to the root level of the project
const _root_level = path.join( __dirname, ".." );

module.exports = {

    // Helper Function to check if the path is set to relative
    isRelative: function ( _path ) {
        if ( _path.startsWith( "." ) ) { return true; }
        else { return false; }
    },

    // Check and Build the local folder structure
    build: function ( _cfg ) {

        // Collect the local folder structure        
        let _local_structure = {};

        // Set App Root folder
        _local_structure.root_folder = _root_level;

        // Path to Blender
        if( _cfg.blender_path == "" ) {
            console.error( "\x1b[31mERROR\x1b[0m : Blender Path not set!" );
            process.exit(1);
        } else {
            _local_structure.blender_path = _cfg.blender_path;
        }

        // Directories for SERVER
        _local_structure.project_folder = this.checkAndBuild( _root_level, _cfg.project_folder );
        _local_structure.render_folder = this.checkAndBuild( _root_level, _cfg.render_folder );
        _local_structure.logs_folder = this.checkAndBuild( _root_level, _cfg.logs_folder );
    
        // Directories for NODES
        _local_structure.temp_projects = this.checkAndBuild( _root_level, _cfg.temp_projects );
        _local_structure.temp_media = this.checkAndBuild( _root_level, _cfg.temp_media );
        _local_structure.temp_logs = this.checkAndBuild( _root_level, _cfg.temp_logs );

        // console.log( "\x1b[32mEnvironment\x1b[0m : " );
        // console.log( _local_structure );

        return _local_structure;

    },

    // Check and build directories
    checkAndBuild: function ( _root, _folder ) {

        let _f;
        if( this.isRelative( _folder ) ) {
            _f = path.join( _root, _folder ); // Build the absolute path from the relative path
        } else {
            _f = _folder; // Use the given absolute path
        }

        // Check if the folder exists
        if( !fs.existsSync( _f ) ) {
            fs.mkdirSync( _f );
        }

        return _f;

    },

    // Get the list of Blender Files in the Project Folder
    getProjectFiles: function ( _ld ) {

        let _files = fs.readdirSync( _ld.project_folder );
        let _blender_files = [];
        for( let i=0; i<_files.length; i++ ) {
            if( _files[i].endsWith( ".blend" ) ) {
                _blender_files.push( _files[i] );
            }
        }
        return _blender_files;
    },

    transferFile: async function ( _file, _target, _port, _api, _type ) {

        let data = new FormData();
        data.append( _type , fs.createReadStream( _file ) );

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://' + _target + ":" + _port + _api,
            headers: { ...data.getHeaders() },
            data : data
        };

        axios.request(config)
        .then( ( response ) => {
            console.log(JSON.stringify(response.data));
        }).catch( ( error ) => {
            console.log( error );
        });

    }

}