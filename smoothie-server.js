/* ------------------------------------------------

  Smoothie::Server - version 0.1.0

  Use this server to send Blender files and render
  instructions to nodes.

  (c) 2024 - MENiAC Oy / meniac.tech

------------------------------------------------ */

/* NEEDED FEATURES:

  - Get Available Nodes & States
  - Get Nodes Blender Versions
  - Get Nodes Render Status?
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
const ip = require('ip');
let _config = {};
let _local_data = {};
let _nodes = [];
let _files_in_project_folder = [];

// Possible Node States:
const STATUS = {
  UNDEFINED: -1,
  UNKNOWN: 0,
  READY: 1,
  PAUSED: 2,
  RENDERING: 3,
  ERROR: 99
}



// ******************************* //
// *** Read server config file *** //
// ******************************* //
fs.readFile("./config/server-config.json", "utf8", (error, data) => {
  if (error) {
    console.log(error);
    return;
  }
  _config = JSON.parse(data);
  init(_config);
});

function init( cfg ) {

  // console.log( cfg );

  app.use( cors() );
  app.use( express.static( path.join( __dirname, "html" ) ) );

  app.get('/', (req, res) => {
    res.sendFile( path.join( __dirname, '/html/smoothie-server.html' ) );
  })

  app.get('/api/project-files', (req, res) => {
    get_files_in_project_folder();

    res.send( _files_in_project_folder );
  })

  app.get('/api/get_directories', (req, res) => {

    let _directories = [];
    _directories.push( path.join( __dirname, _config.project_folder ) );
    _directories.push( path.join( __dirname, _config.working_folder ) );
    _directories.push( path.join( __dirname, _config.render_folder ) );
    _directories.push( path.join( __dirname, _config.logs_folder ) );

    let _directories_json = JSON.stringify( _directories );
    res.send( _directories_json );

  })
  
 
  app.listen(cfg.server_port, () => {
    _local_data.server_ip = ip.address();
    console.log( 'Smoothie Server Online.');
    console.log( 'System IP Address: ' + _local_data.server_ip );
    console.log( `Smoothie listening on port ${cfg.server_port}` );

    api_scan_nodes();

  })


  // Show some information:
  console.log( "Project folder: " + path.join( __dirname, _config.project_folder ) );
  console.log( "Working folder: " + path.join( __dirname, _config.working_folder ) );
  console.log( "Render folder: " + path.join( __dirname, _config.render_folder ) );
  console.log( "Logs folder: " + path.join( __dirname, _config.logs_folder ) );

  get_files_in_project_folder();

}

function get_files_in_project_folder() {
  fs.readdir( path.join( __dirname, _config.project_folder ), (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    const blendFiles = files.filter(el => path.extname(el) === '.blend')
    _files_in_project_folder = JSON.stringify( blendFiles );
    console.log("Files in project folder: ");
    console.log( _files_in_project_folder );
  });
}

function api_scan_nodes() {

  // Loop through all nodes in my ip space
  // and check if they are running Smoothie::Node

  let _ip_space = _local_data.server_ip.split('.');

  for( let i = 0; i < 255; i++ ) {
    // let _ip = '192.168.1.' + i;
    let _ip = `${_ip_space[0]}.${_ip_space[1]}.${_ip_space[2]}.${i}`;
    let _ping = fetch( `http://${_ip}:${_config.node_port}/api/ping` )
      .then( res => res.text() )
      .then( (text) => {
        console.log( "Node Found : " + _ip + " - " + text ) 
      }).then( (text) => {
         if( text === "Alive!" ) _nodes.push( _ip );
         console.log("Calling Node to give it Servers IP...");
         let _server_ip = fetch( `http://${_ip}:${_config.node_port}/api/set_server_ip?ip=${_local_data.server_ip}` )
          .catch( error => console.log( error ) );
      }).catch( error => {
        // console.log( error );
      });
  }

}