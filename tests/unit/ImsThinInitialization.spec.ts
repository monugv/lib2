import { AdobeImsFactory, AdobeIMSKey } from "../../src/constants/ImsConstants";
import { AdobeIMSThin } from '../../src/adobe-ims/AdobeIMSThin';
import MainThin from "../../src/MainThin";

const adobeData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',
};

describe( "ImsThinInitialization", () => {

    it( 'ensure the Main instance is called', async () => {
        expect( MainThin.initialize() ).toBeTrue();
    } );

    it( 'create adobeIms', () => {

        const factory = window[AdobeImsFactory];
        expect( factory ).not.toBe( null );

        factory.createIMSLib( adobeData );

        const imsLib: AdobeIMSThin = window[AdobeIMSKey];

        expect( imsLib ).toBeDefined();
    } );

    it('client id is empty', () => {
        const factory = window[AdobeImsFactory];
        expect( factory ).not.toBe( null );

        let func = function () {
            factory.createIMSLib({
                locale: 'ro',
                scope: 'AdobeID,openid',
            })};

        expect(func).toThrowError("Please provide required adobeId, client_id information");
    })
} );
