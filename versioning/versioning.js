const { exec } = require( 'child_process' );
const fs = require( 'fs-extra' );
exec( "git describe", ( error, stdout, stderr ) => {
    if ( error ) {
        console.log( `error: ${error.message}` );
        return;
    }
    if ( stderr ) {
        console.log( `stderr: ${stderr}` );
        return;
    }
    const environmentFilePath = './src/adobe-ims/environment/Environment.ts';
    const gitVersion = stdout.replace( /\r?\n|\r/g, '' );

    const adobeIdDataContent = fs.readFileSync( environmentFilePath, { encoding:'utf8', flag:'r' } );

    const newAdobeIdDataContent = adobeIdDataContent.replace( / jslibver =(.*?);/gi, ` jslibver = 'v2-${gitVersion}';` );

    fs.writeFileSync( environmentFilePath, newAdobeIdDataContent ); 

    /**
     * Needed for pipeline
     */
    fs.writeFileSync( './version.json', JSON.stringify( { gitVersion } ) );
    
} );