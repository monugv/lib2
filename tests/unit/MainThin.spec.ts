import { AdobeImsFactory, AdobeIMSKey } from "../../src/constants/ImsConstants";
import MainThin from '../../src/MainThin';
import { AdobeIMS } from '../../src/adobe-ims/AdobeIMS';

const adobeData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',
};

describe( "MainThin", () => {
    it( 'ensure the MainThin instance is called', () => {
        MainThin.initialize();
    } )

    it( 'create adobeIms', () => {

        const factory = window[AdobeImsFactory];
        expect( factory ).not.toBe( null );

        factory.createIMSLib( adobeData );

        const imsLib: AdobeIMS = window[AdobeIMSKey];

        expect( imsLib ).toBeDefined();
    } )
} );
