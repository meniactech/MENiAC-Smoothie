// Commong Functions
function e( id ) { return document.getElementById( id ); }
function c( type ) { return document.createElement( type ); }

const _busy_icon = "&#128997;";     // Red Box Unicode Character
const _ready_icon = "&#129001;";    // Green Box Unicode Character

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

function storeLastFileName( filename ) { localStorage.setItem( "last_filename", filename ); }
function getLastFileName() { return localStorage.getItem( "last_filename" ); }
function clearLastFileName() { localStorage.removeItem( "last_filename" ); }

function storeProjectData( project_data ) { localStorage.setItem( "project_data", JSON.stringify( project_data ) ); }
function getProjectData() { return JSON.parse( localStorage.getItem( "project_data" ) ); }
function clearProjectData() { localStorage.removeItem( "project_data" ); }
