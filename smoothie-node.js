/* ------------------------------------------------

    Smoothie::Node - version 0.1.0

    Use this node to all render machines.
    Server will send Blender files and render
    instructions to this node.

    (c) 2024 - MENiAC Oy / meniac.tech

------------------------------------------------ */

/* NEEDED FEATURES:

    - Get Node State
    - Get Blender Version
    - Get Blender Render Status?
    - Get Render Progress?
    - Get Rendered Frames / History
    - Get Rendering Capabilities

*/

const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');  // Node-Fetch version 2 !!!
const cors = require('cors');
const path = require('path');
const app = express();
let _config = {};
let _local_data = {};

// Possible Node States:
const STATUS = {
    UNDEFINED: -1,
    UNKNOWN: 0,
    READY: 1,
    PAUSED: 2,
    RENDERING: 3,
    ERROR: 99
}
let _status = STATUS.UNDEFINED;


// ******************************* //
// *** Read client config file *** //
// ******************************* //
fs.readFile("./config/node-config.json", "utf8", (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    _config = JSON.parse(data);
    init( _config );
  });


function init( cfg ) {
  
    app.use( cors() );
    app.use( express.static( path.join( __dirname, "html" ) ) );

    app.get('/', (req, res) => {
        res.sendFile( path.join( __dirname, '/html/smoothie-node.html' ) );
    })

    app.get('/api/ping', (req, res) => {
        res.send('Alive!');
    })

    app.get('/api/get_state', (req, res) => {
        api_get_node_state( res );
    })

    app.get('/api/set_server_ip', (req, res) => {
        api_set_server_ip( req );
    })

    app.get('/api/blender_version', (req, res) => {
        api_blender_version( res );
    })

    app.get('/api/get_blender_path', (req, res) => {
        res.send( JSON.stringify( _config.blender_path ) );
    })

    app.listen(cfg.node_port, () => {
        console.log(`Smoothie::Node - Listening on port ${cfg.node_port}`);
    })

    // Show some information:
    console.log( "Project folder: " + path.join( __dirname, _config.project_folder ) );
    console.log( "Working folder: " + path.join( __dirname, _config.working_folder ) );
    console.log( "Render folder: " + path.join( __dirname, _config.render_folder ) );
    console.log( "Logs folder: " + path.join( __dirname, _config.logs_folder ) );

}



function api_set_server_ip( req ) {
    
    let _ip = req.query.ip;
    _local_data.server_ip = _ip;
    console.log( 'Smoothie::Node - Server Called and gave me an IP : ' + _local_data.server_ip );
    
}


function api_blender_version( res ) {
    console.log('API::blender_version');
    const { execFile } = require('node:child_process');
    const child = execFile(_config.blender_path, ['-v'], (error, stdout, stderr) => {
        if (error) {
            throw error;
        }
        let _version = stdout.split('\n').shift().trim();
        console.log( _version );
        
        if( res != undefined && res != null ) {
            _sent_res = { "data" : _version };
            console.log( 'Sending response : ' + JSON.stringify( _sent_res ) );
            res.json( _sent_res );
    } else {
        _local_data.blender_version = _version;
    }
});

}

function api_get_node_state( res ) {
    res.send('get_node_state');
}

function set_node_state( state ) {
    _status = state;
}

function get_node_state() {
    return _status;
}

function get_node_state_as_string() {
    switch(_status)
    {
        case STATUS.UNDEFINED:
            return 'Undefined';
            break;
        case STATUS.UNKNOWN:
            return 'Unknown';
            break;
        case STATUS.READY:
            return 'Ready';
            break;
        case STATUS.PAUSED:
            return 'Paused';
            break;
        case STATUS.RENDERING:
            return 'Rendering';
            break;
        case STATUS.ERROR:
            return 'Error';
            break;
        default:
            return 'Unknown';
    }
}

