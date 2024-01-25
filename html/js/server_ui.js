// Desc: Smoothie Server related Functionality

// Wait until page has loaded:
window.addEventListener("DOMContentLoaded", (event) => {

    // Connect Events:
    let _refresh_projects_button = e("btn_refresh_project_files");
    _refresh_projects_button.addEventListener( "click", populate_project_files );

    let _refresh_nodes_button = e("btn_refresh_nodes");
    _refresh_nodes_button.addEventListener( "click", populate_nodes );

    let _project_files = e("project_files");
    _project_files.addEventListener( "change", handle_project_file_change );

    // Populate the list of Projects
    populate_project_files();

    // Get the list of Server Directories
    get_directories();

    // Get the list of Nodes
    populate_nodes();

});

async function get_directories() {
    console.log( "Getting directories..." );
    let _d = await apiCall( '/api/get_directories' );
    if( _d == null ) {
        console.log( "ERROR : Could not get directories." );
        return;
    } else {
        e("project_folder").innerHTML   = _d.project_folder;
        e("render_folder").innerHTML    = _d.render_folder;
        e("logs_folder").innerHTML      = _d.logs_folder;
        e("temp_projects").innerHTML    = _d.temp_projects;
        e("temp_media").innerHTML       = _d.temp_media;
        e("temp_logs").innerHTML        = _d.temp_logs;
    }
}

async function loadLastFile() {
    let _last_filename = getLastFileName();
    if( _last_filename != null ) {
        console.log("Loading last file ... " + _last_filename );
        e("project_files").value = _last_filename;
        console.log( "Select : " +  e("project_files").value );
        handle_project_file_change();
    }
}

async function handle_project_file_change() {
    let _project_file = e("project_files").value;
    console.log( "Project File : " + _project_file );
    if( _project_file == "" ) {
        e("project_name").innerHTML = "...";
        e("project_times").innerHTML = "...";
        e("project_resolutions").innerHTML = "...";
        return;
    } else {
        let _d = await apiCall( '/api/get_project_file_info?file=' + _project_file );
        console.log( "Project File Info : " );
        console.log( _d );
        try {
            if( _d.ERROR ) {
                console.log( "ERROR : " + _d.ERROR );
                return;
            } else {
                e("project_name").innerHTML = _project_file;
                let project_times = _d.anim_start;
                project_times += ", " + _d.anim_end;
                project_times += ", " + ( parseInt( _d.anim_end ) - parseInt( _d.anim_start ) );
                e("project_times").innerHTML = project_times;
                e("project_resolutions").innerHTML = _d.resolution_x + " x " + _d.resolution_y;
                storeLastFileName( _project_file );
            }
        } catch( error ) {
            console.log( error );
        }
    }
}


async function populate_project_files() {

    console.log( "Populating project files..." );
    let _files = await fetch( '/api/project-files' );
    let _files_json = await _files.json().then( (data) => {
        console.log( "Files in project folder : " + data.length );
        e("project_files").innerHTML = "<option value=''>Blender Files</option>";
        e("project_files").innerHTML += "<option value=''>- - - - - - - - - - -</option>";
        for( let i=0; i<data.length; i++ ) {
            e("project_files").innerHTML += "<option value='" + data[i] + "'>" + data[i] + "</option>";
        }
        loadLastFile(); // Load Last File after populating the list
    }).catch( (error) => {
        console.log( error );
    });
}


async function populate_nodes() {

    e("list_of_nodes").innerHTML = "";
    let _nodes_update = await fetch( '/api/rebuild_nodes' );
    let _nodes = await fetch( '/api/get_nodes' );
    let _nodes_json = await _nodes.json().then( (data) => {
        console.log( "Populating nodes..." );
        console.log( data );
        for( let i=0; i<data.length; i++ ) {
            console.log( data[i] );
            let _node_list_item = c("div");
            _node_list_item.classList.add("node_list_item");
            let _node_list_item_checkbox = c("div");
            _node_list_item_checkbox.classList.add("node_item_checkbox");
            let _node_list_item_ip = c("div");
            _node_list_item_ip.classList.add("node_item_text");
            let _node_list_item_status = c("div");
            _node_list_item_checkbox.innerHTML = "<input type='checkbox' name='node' id='node_" + data[i] + "' value='" + data[i] + "' checked></input>";
            _node_list_item_ip.innerHTML = data[i];
            _node_list_item_status.innerHTML = "&#129001;";
            _node_list_item.appendChild( _node_list_item_checkbox );
            _node_list_item.appendChild( _node_list_item_ip );
            _node_list_item.appendChild( _node_list_item_status );
            e("list_of_nodes").appendChild( _node_list_item );
        }
    }).catch( (error) => {
        console.log( error );
    });
}


