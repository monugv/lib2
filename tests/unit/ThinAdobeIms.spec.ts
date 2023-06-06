import { AdobeIMSThin } from '../../src/adobe-ims/AdobeIMSThin';
import { AdobeIdKey } from "../../src/constants/ImsConstants";
import FragmentHelper from '../../src/url/FragmentHelper';

describe( 'signIn method', () => {

    it( 'throws error in case the AdobeIdData is empty', () => {
        // save the adobeId information and set it as null in order to simulate scenario when there is not adobeId value
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;

        expect( () => new AdobeIMSThin() ).toThrowError( 'Please provide required adobeId, client_id information' );

        // set back the adobeId value
        window[AdobeIdKey] = adobeIdData;

    } );

    it( "throws error in case the clientId is empty", () => {
        // save the adobeId information and set it as null in order to simulate scenario when there is not adobeId value
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = {
            scope : "testScope"
        };
        expect( () => new AdobeIMSThin() ).toThrowError(
            "Please provide required adobeId, client_id information"
        );

        // set back the adobeId value
        window[AdobeIdKey] = adobeIdData;

    } );
    
} );

describe( 'fragmentValues', () => {

    it( 'not calls the sign out command if no token', () => {

        const adobeIMS = new AdobeIMSThin();

        const fragmentToObjectSpy = spyOn( FragmentHelper, 'fragmentToObject' );

        adobeIMS.fragmentValues();

        expect( fragmentToObjectSpy ).toHaveBeenCalled();
    } );
} );

describe( 'getNonce', () => {

    it( 'returns the nonce from fragment', () => {

        const adobeIMS = new AdobeIMSThin();

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( () => {
            return {
                state:
                {
                    nonce: 'nonceval',
                }
            }
        } );

        const nonceResponse = adobeIMS.getNonce();

        expect( nonceResponse ).toEqual( 'nonceval' );
    } );
} );