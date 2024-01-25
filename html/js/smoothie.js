// Commong Functions
function e( id ) { return document.getElementById( id ); }
function c( type ) { return document.createElement( type ); }

async function apiCall( url ) {
    let _response = await fetch( url );
    let _response_json = await _response.json().then( (data) => {
        return data;
    }).catch( (error) => {
        console.log( error );
        return null;
    });
    return _response_json;
}

function storeLastFileName( filename ) {
    console.log( "Storing last filename : " + filename );
    localStorage.setItem( "last_filename", filename );
}

function getLastFileName() {
    return localStorage.getItem( "last_filename" );
}

function clearLastFileName() {
    localStorage.removeItem( "last_filename" );
}


