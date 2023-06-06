import { AdobeImsFactory, AdobeIMSKey } from "../../src/constants/ImsConstants";
import { AdobeIMS } from '../../src/adobe-ims/AdobeIMS';
import Xhr from "../../src/ims-apis/xhr/Xhr";

const adobeData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',

};

describe( "Main", () => {
    it( 'ensure the Main instance is called', async () => {
        spyOn( Xhr, "post" ).and.callFake( () => Promise.resolve( {} ) )
        const Main = ( await import( '../../src/Main' ) ).default;
        expect( Main.initialize() ).toBeTrue();
    } )

    it( 'create adobeIms', () => {
        
        const factory = window[AdobeImsFactory];
        expect( factory ).not.toBe( null );

        factory.createIMSLib( adobeData );

        const imsLib: AdobeIMS = window[AdobeIMSKey];
        
        expect( imsLib ).toBeDefined();
        
    } )
} );
