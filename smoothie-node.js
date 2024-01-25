/* ------------------------------------------------

    Smoothie::Node - version 0.1.3

    Use this node to all render machines.
    Server will send Blender files and render
    instructions to this node.

    (c) 2024 - MENiAC Oy / meniac.tech

------------------------------------------------ */

const express       = require("express");
const fs            = require("fs");
const fetch         = require("node-fetch"); // Node-Fetch version 2 !!!
const cors          = require("cors");
const path          = require("path");
const app           = express();
const environment   = require("./modules/environment.js");
const status_codes  = require("./modules/status_codes.js");

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
    startNode(_config);
});

function startNode(cfg) {

    // Check and Build Environment Folder Structure
    _local_data = environment.build(_config);

    app.use(cors());
    app.use(express.static(path.join(__dirname, "html")));

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "/html/node_ui.html"));
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
        await api_blender_version(res);
    });

    // Get Server IP
    app.get("/api/get_server_ip", (req, res) => {
        res.send(api_get_server_ip());
    });

    app.get("/api/get_blender_path", (req, res) => {
        res.send(JSON.stringify(_config.blender_path));
    });

    app.listen(cfg.node_port, () => {
        console.log(`Smoothie::Node - Listening on port ${cfg.node_port}`);
    });

    // Show some information:
    // console.log("Project folder: " + path.join(__dirname, _config.project_folder));
    // console.log("Render folder: " + path.join(__dirname, _config.render_folder));
    // console.log("Logs folder: " + path.join(__dirname, _config.logs_folder));
}

function api_set_server_ip(req) {
    let _ip = req.query.ip;
    _local_data.server_ip = _ip;
    console.log( "Smoothie::Node - Server Called and gave me an IP : " + _local_data.server_ip );
}

async function api_blender_version(res) {
    console.log("API::blender_version");
    const { execFile } = require("node:child_process");
    const child = await execFile( _config.blender_path, ["-v"], (error, stdout, stderr) => {
        if (error) { throw error; }
        let _version = stdout.split("\n").shift().trim();
        console.log(_version);
        if (res != undefined && res != null) {
            _sent_res = { data: _version };
            console.log("Sending response : " + JSON.stringify(_sent_res));
            res.json(_sent_res);
        } else {
            _local_data.blender_version = _version;
        }
    });
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
