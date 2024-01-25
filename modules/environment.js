const fs = require("fs");
const path = require("path");

const _root_level = path.join(__dirname, "..");

module.exports = {

    // Check and Build the local folder structure
    build: function (_cfg) {

        // NEEDS REFACTORING !!!

        // Collect the local folder structure        
        let _local_structure = {};

        // Set App Root folder
        _local_structure.root_folder = _root_level;

        // Directories for SERVER
        _local_structure.project_folder = path.join(_root_level, _cfg.project_folder);
        if (!fs.existsSync(path.join(_root_level, _cfg.project_folder))) {
            fs.mkdirSync(path.join(_root_level, _cfg.project_folder));
        }
        _local_structure.render_folder = path.join(_root_level, _cfg.render_folder);
        if (!fs.existsSync(path.join(_root_level, _cfg.render_folder))) {
            fs.mkdirSync(path.join(_root_level, _cfg.render_folder));
        }
        _local_structure.logs_folder = path.join(_root_level, _cfg.logs_folder);
        if (!fs.existsSync(path.join(_root_level, _cfg.logs_folder))) {
            fs.mkdirSync(path.join(_root_level, _cfg.logs_folder));
        }
    
        // Directories for NODES
        _local_structure.temp_projects = path.join(_root_level, _cfg.temp_projects);
        if (!fs.existsSync(path.join(_root_level, _cfg.temp_projects))) {
            fs.mkdirSync(path.join(_root_level, _cfg.temp_projects));
        }
        _local_structure.temp_media = path.join(_root_level, _cfg.temp_media);
        if (!fs.existsSync(path.join(_root_level, _cfg.temp_media))) {
            fs.mkdirSync(path.join(_root_level, _cfg.temp_media));
        }
        _local_structure.temp_logs = path.join(_root_level, _cfg.temp_logs);
        if (!fs.existsSync(path.join(_root_level, _cfg.temp_logs))) {
            fs.mkdirSync(path.join(_root_level, _cfg.temp_logs));
        }

        return _local_structure;

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
    }

}