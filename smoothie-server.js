/* ------------------------------------------------

Smoothie::Server - version 0.1.3

Use this server to send Blender files and render
instructions to nodes.

(c) 2024 - MENiAC Oy / meniac.tech

------------------------------------------------ */

const express       = require("express");
const fs            = require("fs");
const multer        = require("multer");
let   receive_rendered_image_file; // Multer for rendered images
const fetch         = require("node-fetch"); // Node-Fetch version 2 !!!
const cors          = require("cors");
const path          = require("path");
const app           = express();
const ip            = require("ip");
const environment   = require("./modules/environment.js");
const blender       = require("./modules/blender.js");
const status_codes  = require("./modules/status_codes.js");
const { start } = require("repl");

let _config         = {}; // Contains the config.json Data
let _local_data     = {}; // Filled with data from config.json and converted to local paths
let _smoothie_nodes = []; // List of nodes in the network
let _project_files  = []; // List of files in the project folder
let _project_info   = {}; // Information about the current project

// ------------------------------------ //
//     Load Config and Start Server     //
// ------------------------------------ //
fs.readFile("./config/config.json", "utf8", (error, data) => {
    if (error) {
        console.log(error);
        return;
    }
    _config = JSON.parse(data);
    
    // Set the upload folder and right file names for transferred images
    receive_rendered_image_file = multer.diskStorage({
        destination: function (req, file, cb) { cb(null, _config.render_folder ); },
        filename: function (req, file, cb) { cb(null, file.originalname ); } // Keep the original name
    });

    // Start the server
    startServer(_config);
});

function startServer(cfg) {

    // Check and Build Environment Folder Structure
    _local_data = environment.build(_config);

    // Scan Project Folder for Blender Files
    _project_files = environment.getProjectFiles(_local_data);

    app.use(cors()); // Enable CORS
    app.use(express.static(path.join(__dirname, "html"))); // Set the root for HTML

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "/html/server_ui.html"));
    });

    app.get("/api/project-files", (req, res) => {
        _project_files = environment.getProjectFiles(_local_data);
        res.send(_project_files);
    });

    app.get("/api/get_project_file_info", async (req, res) => {
        let _file = req.query.file;
        console.log( "FILE : " + _file );
        _project_info = await blender.getBlenderFileInformation( res, _file, _config, _local_data );
        console.log( "PROJECT INFO : " + _project_info );
    });


    app.get("/api/render", (req, res) => {
        if( req.query.file == "" ) {
            res.send("File Missing!");
        } else {
            res.sendFile( req.query.file + " : OK");
        }
    });

    app.get('/api/start_render', async (req, res) => {
        let _file = req.query.file;
        console.log( "Starting Render : " + _file );
        let _render_info = await startRender( _file );
        console.log( _render_info );
        res.send( "OK" );
    });

    app.get("/api/get_directories", (req, res) => {
        // console.log(_local_data);
        res.send(JSON.stringify(_local_data));
    });

    app.get("/api/rebuild_nodes", async (req, res) => {
        await api_scan_nodes();
        res.send("OK");
    });

    app.get("/api/get_nodes", (req, res) => {
        res.send(JSON.stringify(_smoothie_nodes));
    });

    app.listen(cfg.server_port, () => {
        _local_data.server_ip = ip.address();
        console.log("Smoothie Server Online.");
        console.log("System IP Address: " + _local_data.server_ip);
        console.log(`Smoothie listening on port ${cfg.server_port}`);
        api_scan_nodes();
    });



    // console.log(_config);
    // console.log(_local_data);
    // console.log(_nodes);
    // console.log(_project_files);
}


async function startRender( _filename ) {

    console.log( "Starting Render Procedure ..." );
    console.log( "Sending File to Nodes: " + _filename );

    return "Render OK";

    var formdata = new FormData();
    formdata.append("blend_file", fileInput.files[0], "D:\dev\MENiAC_Smoothie\projects\file_1.blend");

    var requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
    };

    fetch("localhost:8009/api/reveive_blend_file?file", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));

}

async function api_scan_nodes() {
    // Loop through all nodes in my ip space
    // and check if they are running Smoothie::Node

    let _ip_space = _local_data.server_ip.split(".");
    _smoothie_nodes = []; // Reset the list of nodes

    for (let i = 0; i < 255; i++) {
        let _ip = `${_ip_space[0]}.${_ip_space[1]}.${_ip_space[2]}.${i}`;
        let _ping = await fetch(`http://${_ip}:${_config.node_port}/api/ring`, { signal: AbortSignal.timeout( 10 ) })
            .then((res) => res.text())
            .then((text) => {
                console.log(_ip + " : " + text)
                if (text.trim() == "OK") {
                    console.log("Node Found : " + _ip);
                    _smoothie_nodes.push(_ip);
                }
                console.log("Calling Node to give it Servers IP...");
                let _server_ip = fetch(
                    `http://${_ip}:${_config.node_port}/api/set_server_ip?ip=${_local_data.server_ip}`
                ).catch((error) => {
                    console.log("Just to let You know that Connection Reset @ " + _ip );
                });
            })
            .catch((error) => {
                // console.log( error );
            });
    }
    console.log("Total Nodes Found : " + _smoothie_nodes.length);
}
