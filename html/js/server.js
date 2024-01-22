function e( id ) {
    return document.getElementById( id );
}

window.addEventListener("DOMContentLoaded", (event) => {

    // Connect Events:
    let _refresh_projects_button = e("btn_refresh_project_files");
    _refresh_projects_button.addEventListener( "click", populate_project_files );

});

async function get_directories() {

    console.log( "Getting directories..." );
    let _directories = await fetch( '/api/get_directories' );

    let _directories_json = await _directories.json().then( (data) => {
        e("project_directory").innerHTML = data[0];
        e("working_directory").innerHTML = data[1];
        e("render_directory").innerHTML = data[2];
        e("logs_directory").innerHTML = data[3];
        console.log( "Directories: " + data.length );
        console.log( data );
    }).catch( (error) => {
        console.log( error );
    });
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

    }).catch( (error) => {
        console.log( error );
    });
}


