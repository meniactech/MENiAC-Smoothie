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
const environment   = require("./modules/environment.js");
const blender       = require("./modules/blender.js");
const status_codes  = require("./modules/status_codes.js");
const { stdout }    = require("process");

let _config         = {}; // Contains the config.json Data
let _local_data     = {}; // Filled with data from config.json and converted to local paths

let _status = status_codes.UNDEFINED;

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
});

function startNode(cfg) {

    // Clear Console
    console.clear();

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
        blender.render( req, res, _config, _local_data );
        // await render( req, res );
        res.send("OK");
    });

    app.post("/api/transfer_blend_file", blender_file_upload.single("blend_file"), (req, res) => {
        console.log("\x1b[35mSmoothie::Node\x1b[0m - Receiving Blender File " + req.file.name + " from Server.");
        res.send("OK");
    });

    app.listen(cfg.node_port, () => {
        console.log(`\x1b[35mSmoothie::Node\x1b[0m - Listening on port ${cfg.node_port}`);
    });
}

function api_set_server_ip(req) {
    let _ip = req.query.ip;
    _local_data.server_ip = _ip;
    console.log( "\x1b[35mSmoothie::Node\x1b[0m - Server Called and gave me an IP : " + _local_data.server_ip );
}

function api_get_server_ip() {
    console.log(_local_data.server_ip);
    return JSON.stringify(_local_data.server_ip);
}

function api_get_node_state(res) {
    res.send("get_node_state");
}

function set_node_state(state) {
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
