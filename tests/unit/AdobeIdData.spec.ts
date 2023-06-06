import { AdobeIdData } from "../../src/adobe-id/AdobeIdData";
import { IErrorType } from "../../src/adobe-id/IErrorType";
import Environment from "../../src/adobe-ims/environment/Environment";
import { AdobeIdKey } from "../../src/constants/ImsConstants";
import { StandaloneToken } from "../../src/token/StandaloneToken";
import adobeIdDataValues from "./test-data";

let adobeIdData = new AdobeIdData();

describe( "AdobeId contains the information from browser", () => {
    it( "window.adobeid", () => {
        const adobeid = window[AdobeIdKey];

        expect( adobeIdData.scope ).toBe( adobeid.scope );
        expect( adobeIdData.client_id ).toBe( adobeid.client_id );
    } );

    it( "contains the provided data", () => {
        adobeIdData = new AdobeIdData( adobeIdDataValues );

        expect( adobeIdData.scope ).toBe( adobeIdDataValues.scope );
        expect( adobeIdData.client_id ).toBe( adobeIdDataValues.client_id );
    } );

    it( "useLocalStorage is passed to AdobeIdData", () => {
        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
        };
        adobeIdData = new AdobeIdData( newAdobeIdValues );

        expect( adobeIdData.scope ).toBe( adobeIdDataValues.scope );
        expect( adobeIdData.client_id ).toBe( adobeIdDataValues.client_id );
        expect( adobeIdData.useLocalStorage ).toBeTruthy;
        expect( adobeIdData.autoValidateToken ).toBeTruthy;
    } );

    it( "adobeidData use of handlers", () => {
        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            modalmode: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };
        adobeIdData = new AdobeIdData( newAdobeIdValues );

        expect( adobeIdData.scope ).toBe( adobeIdDataValues.scope );
        expect( adobeIdData.client_id ).toBe( adobeIdDataValues.client_id );
        expect( adobeIdData.useLocalStorage ).toBeTruthy;
        expect( adobeIdData.modalMode ).toBeTruthy;
        expect( adobeIdData.autoValidateToken ).toBeTruthy;
        expect( adobeIdData.standalone ).toEqual(
            new StandaloneToken( { ...tokenInfo, expirems: 6000 } )
        );

        adobeIdData.handlers.triggerOnAccessToken( tokenInfo );
        expect( newAdobeIdValues.onAccessToken ).toHaveBeenCalled();

        adobeIdData.handlers.triggerOnAccessTokenHasExpired();
        expect( newAdobeIdValues.onAccessTokenHasExpired ).toHaveBeenCalled();

        adobeIdData.handlers.triggerOnReady( null );
        expect( newAdobeIdValues.onReady ).toHaveBeenCalled();

        adobeIdData.handlers.triggerOnReauthAccessToken( tokenInfo );
        expect( newAdobeIdValues.onReauthAccessToken ).toHaveBeenCalled();

        adobeIdData.handlers.triggerOnError( IErrorType.HTTP, null );
        expect( newAdobeIdValues.onError ).toHaveBeenCalled();

        adobeIdData.createSocialProviderRedirectRequest(
            "provider",
            { a: 1 },
            { age: 1 },
            "nonce"
        ).then( redirect => {
            expect( redirect ).toEqual( {
                adobeIdRedirectUri: '',
                apiParameters: { test: 1 },
                clientId: "IMSLibJSTestClient",
                externalParameters: {
                    a: 1,
                    idp_flow: "social.deep_link.web",
                    provider_id: "provider",
                },
                scope: "adobeid",
                locale: "ro",
                response_type: "token",
                state: {
                    context: { age: 1 },
                    jslibver: Environment.jslibver,
                    nonce: "nonce",
                },
            } );
        } )

        
    } );
} );
