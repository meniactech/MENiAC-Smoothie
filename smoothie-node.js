/* ------------------------------------------------

    Smoothie::Node - version 0.1.3

    Use this node to all render machines.
    Server will send Blender files and render
    instructions to this node.

    (c) 2024 - MENiAC Oy / meniac.tech

------------------------------------------------ */

const express       = require("express");
const fs            = require("fs");
const multer        = require("multer");
let   storage_blender_file; // Multer for Blender files
let   blender_file_upload;
const fetch         = require("node-fetch"); // Node-Fetch version 2 !!!
const cors          = require("cors");
const path          = require("path");
const app           = express();
const ip            = require("ip");
const environment   = require("./modules/environment.js");
const blender       = require("./modules/blender.js");
const status_codes  = require("./modules/status_codes.js");
const { stdout }    = require("process");

const { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ButtonPopup, ConfirmPopup } = require( 'console-gui-tools' );
// const { ConsoleManager } = require('console-gui-tools');

let _config         = {}; // Contains the config.json Data
let _local_data     = {}; // Filled with data from config.json and converted to local paths
let _render_info    = {};

let _status = status_codes.UNDEFINED;

const GUI = new ConsoleManager({
    title: ' MENiAC - Smoothie Node ',
    logsPageSize: 4,
});

// Creating a main page updater:
const updateConsole = async() => {

    const p = new PageBuilder();

    _render_info = blender.getRenderInfo();

    let _server_ip_info = "";
    if( _local_data.server_ip == undefined ) {
        _server_ip_info = "Please Refresh Nodes in Server";
    } else {
        _server_ip_info = _local_data.server_ip;
    }

    let _status = get_node_state_as_string();

    // p.addRow({ text: '' }); // Empty Row
    p.addRow({ text: `Node IP        : ` },{ text: `${ip.address()} (${_status})`, color: 'yellow' });
    p.addRow({ text: `Server IP      : ` },{ text: `${_server_ip_info}`, color: 'yellow' });
    p.addRow({ text: `Blender Path   : `, },{ text: `${_local_data.blender_path}`, color: 'yellow' });
    p.addRow({ text: `Project Folder : `, },{ text: `${_local_data.project_folder}`, color: 'yellow' });
    p.addRow({ text: `Render Folder  : `, },{ text: `${_local_data.render_folder}`, color: 'yellow' });
    p.addRow({ text: `Logs Folder    : `, },{ text: `${_local_data.logs_folder}`, color: 'yellow' });
    p.addRow({ text: `Temp Projects  : `, },{ text: `${_local_data.temp_projects}`, color: 'yellow' });
    p.addRow({ text: `Temp Media     : `, },{ text: `${_local_data.temp_media}`, color: 'yellow' });
    p.addRow({ text: `Temp Logs      : `, },{ text: `${_local_data.temp_logs}`, color: 'yellow' });

    p.addRow({ text: '' }); // Empty Row
    
    p.addRow({ text: `RENDERING JOB INFO`, color: 'green' });
    p.addRow({ text: 'File to Render   : ' }, { text: `${_render_info.file}`, color: 'yellow' });
    p.addRow({ text: 'Frame#           : ' }, { text: `${_render_info.frame}`, color: 'yellow' });
    p.addRow({ text: 'Time / Remaining : ' }, { text: `${_render_info.time}`, color: 'yellow' }, { text: ` / ` }, { text: `${_render_info.remaining}`, color: 'yellow' });
    p.addRow({ text: 'Memory           : ' }, { text: `${_render_info.memory}`, color: 'yellow' });
    p.addRow({ text: 'Scene            : ' }, { text: `${_render_info.scene}`, color: 'yellow' });
    p.addRow({ text: 'Progress         : ' }, { text: `${_render_info.samples}`, color: 'yellow' });
    
    // p.addRow({ text: '' }); // Empty Row

    GUI.setPage( p, 0 );
}

GUI.on("exit", () => { closeApp(); });

function closeApp() {
    console.log("Closing App");
    process.exit(0);
}

// And manage the keypress event from the library
GUI.on("keypressed", (key) => {
    switch (key.name) {
        case "r":
            drawGui();
            break;
        case "q":
            new ConfirmPopup({
                id: "popupQuit", 
                title: "Are you sure you want to quit?"
            }).show().on("confirm", () => closeApp())
            break;
        default:
            break;
    }
});

const drawGui = ( state = status_codes.READY ) => {
    set_node_state( state );
    updateConsole();
}

// ---------------------------------- //
//     Load Config and Start Node     //
// ---------------------------------- //
fs.readFile("./config/config.json", "utf8", (error, data) => {
    if (error) {
        console.log(error);
        return;
    }
    _config = JSON.parse(data);

    // Set the upload folder and right file names for transferred blender files
    storage_blender_file = multer.diskStorage({
        destination: function (req, file, cb) { cb(null, _config.temp_projects ); },
        filename: function (req, file, cb) { cb(null, file.originalname ); } // Keep the original name
    });
    blender_file_upload = multer({ storage: storage_blender_file });

    // Start the node
    startNode(_config);

    // Start the GUI
    drawGui( status_codes.READY );

});


function startNode(cfg) {

    // Check and Build Environment Folder Structure
    _local_data = environment.build(_config);

    app.use( cors() );
    app.use( express.static( path.join(__dirname, "html" ) ) );

    app.get("/", (req, res) => {
        res.sendFile( path.join( __dirname, "/html/node_ui.html" ) );
    });

    app.get("/api/ring", (req, res) => {
        res.send("OK");
    });

    app.get("/api/get_state", (req, res) => {
        api_get_node_state(res);
    });

    // Store Server IP
    app.get("/api/set_server_ip", (req, res) => {
        api_set_server_ip(req);
    });

    // Get Blender Version
    app.get("/api/blender_version", async (req, res) => {
        await blender.getBlenderVersion( res, _config );
    });

    // Get Server IP
    app.get("/api/get_server_ip", (req, res) => {
        res.send(api_get_server_ip());
    });

    app.get("/api/get_blender_path", (req, res) => {
        res.send(JSON.stringify(_config.blender_path));
    });

    app.get("/api/render", async (req, res) => {
        blender.render( req, res, _config, _local_data, drawGui );
        res.send("OK");
    });

    app.post("/api/transfer_blend_file", blender_file_upload.single("blend_file"), (req, res) => {
        res.send("OK");
    });

    app.listen(cfg.node_port, () => {
        console.log(`Listening on port ${cfg.node_port}`);
    });
}

function api_set_server_ip(req) {
    let _ip = req.query.ip;
    _local_data.server_ip = _ip;
    console.log( "Server Called and gave me it's IP : " + _local_data.server_ip );
    drawGui( status_codes.READY );
}

function api_get_server_ip() {
    console.log(_local_data.server_ip);
    return JSON.stringify(_local_data.server_ip);
}

function api_get_node_state(res) {
    res.send("get_node_state");
}

function set_node_state(state) {
    // console.log("Setting Node State to : " + state);
    _status = state;
}

function get_node_state() {
    return _status;
}

function get_node_state_as_string() {
    switch (_status) {
        case status_codes.UNDEFINED:
            return "Undefined";
            break;
        case status_codes.UNKNOWN:
            return "Unknown";
            break;
        case status_codes.READY:
            return "Ready";
            break;
        case status_codes.PAUSED:
            return "Paused";
            break;
        case status_codes.RENDERING:
            return "Rendering";
            break;
        case status_codes.ERROR:
            return "Error";
            break;
        default:
            return "Status Unknown";
    }
}
