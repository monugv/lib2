
import { CodeChallenge } from '../../src/adobe-ims/pkce/code-challenge';

describe( 'Code Chalenge', () => {

    it( 'generate code challenge ', ( done ) => {
        const codeChallenge: CodeChallenge = new CodeChallenge();
        const key = Math.random().toString( 36 ).replace( /[^a-z]+/g, '' ).substr( 0, 5 );
        codeChallenge.createCodeChallenge( key ).then( response => {
            expect( Object.keys( response ).length ).toBeGreaterThan( 0 );
            done();
        } )
        
    } );


} );

