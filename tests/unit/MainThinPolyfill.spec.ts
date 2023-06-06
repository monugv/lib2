import { AdobeImsFactory, AdobeIMSKey } from "../../src/constants/ImsConstants";
import MainThinPolyfill from '../../src/MainThinPolyfill';
import { AdobeIMS } from '../../src/adobe-ims/AdobeIMS';

const adobeData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',
};

describe( "MainThinPolyfill", () => {
    it( 'ensure the MainThinPolyfill instance is called', () => {
        MainThinPolyfill.initialize();
    } )

    it( 'create adobeIms', () => {

        const factory = window[AdobeImsFactory];
        expect( factory ).not.toBe( null );

        factory.createIMSLib( adobeData );

        const imsLib: AdobeIMS = window[AdobeIMSKey];

        expect( imsLib ).toBeDefined();
    } )
} );
