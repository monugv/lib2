const fs = require( 'fs' );
const fse = require( 'fs-extra' );


function copyFolderRecursiveSync ( source, target ) {

    fs.mkdirSync( target, { recursive: true } );

    fse.copySync( source, target );
}


copyFolderRecursiveSync( 'react/build', '../docs/demo-react-app' );


