// Desc: Smoothie Node related Functionality

// Wait until page has loaded:
window.addEventListener("DOMContentLoaded", (event) => {

    get_blender_path();

    get_blender_version();

    getServerIP();

});

async function get_blender_path() {
    console.log( "Getting directories..." );
    let _d = await apiCall( '/api/get_blender_path' );
    if( _d != null ) {
        e("blender_directory").innerHTML = _d;
    } else {
        console.log( "ERROR : Could not get Blender Path." );
    }
}

async function get_blender_version() {
    console.log( "Getting Blender Version ..." );
    let _d = await apiCall( '/api/blender_version' );
    if( _d != null ) {
        e("blender_version").innerHTML = _d.data;
    } else {
        console.log( "ERROR : Could not get Blender Version." );
    }
}

async function getServerIP() {
    console.log( "Getting Server IP ..." );
    let _d = await apiCall( '/api/get_server_ip' );
    if( _d != null ) {
        e("server_ip").innerHTML = _d;
    } else {
        console.log( "ERROR : Could not get Server IP." );
    }
}






