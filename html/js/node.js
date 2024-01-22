function e( id ) {
    return document.getElementById( id );
}

window.addEventListener("DOMContentLoaded", (event) => {

    get_blender_path();

});

async function get_blender_path() {

    console.log( "Getting directories..." );
    let _directories = await fetch( '/api/get_blender_path' );

    let _directories_json = await _directories.json().then( (data) => {
        e("blender_directory").innerHTML = data;
        console.log( data );
    }).catch( (error) => {
        console.log( error );
    });
}




