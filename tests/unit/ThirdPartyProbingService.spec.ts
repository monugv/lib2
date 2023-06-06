import { ThirdPartyProbingService } from "../../src/adobe-ims/sign-out/ThirdPartyProbingService";
import Xhr from "../../src/ims-apis/xhr/Xhr";

describe( 'execute method', () => {
    it( 'handle no third-party urls', async () => {
        expect( await new ThirdPartyProbingService().probe( [], 'testClientId' ) )
            .toEqual( [] )
    } )

    it( 'handle third-party urls', async () => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            if( url.includes( 'domain2.com' ) ) {
                return Promise.resolve( {
                    ok: false,
                    text: () => Promise.resolve( '{invalid_credentials: true}' )
                } )
            }
            if( url.includes( 'domain3.com' ) ) {
                return Promise.resolve( {
                    ok: true,
                    text: () => Promise.resolve( '{something_else: true}' )
                } )
            }
            if( url.includes( 'domain5.com' ) ) {
                return Promise.reject()
            }
            return Promise.resolve( {
                ok: true,
                text: () => Promise.resolve( '{invalid_credentials: true}' )
            } );
        } );
        expect( await new ThirdPartyProbingService()
            .probe( ['https://domain1.com', 'https://domain2.com', 'https://domain3.com', 'https://domain4.com', 'https://domain5.com'], 'testClientId' ) )
            .toEqual( [0, 2, 3] )
    } )
} )
