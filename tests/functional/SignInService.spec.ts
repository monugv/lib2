import { SignInService } from "../../src/adobe-ims/sign-in/SignInService";
import UrlHelper from "../../src/url/UrlHelper";
import { IRedirectRequest } from "../../src/adobe-ims/facade/IRedirectRequest";
import { AdobeIdData } from "../../src/adobe-id/AdobeIdData";
import { redirectUriMatching } from "../matchers/adobe.matcher";
import adobeIdData from "../unit/test-data";
import { CsrfService } from "../../src/adobe-ims/csrf/CsrfService";
import Environment from "../../src/adobe-ims/environment/Environment";

const createAdobeIdData = (
    overrideParams = {},
    data = adobeIdData
): AdobeIdData => new AdobeIdData( { ...data, ...overrideParams } );

describe( "execute method", () => {
    it( "execute the sign in command with empty nonce", () => {
        const infoSpy = spyOn( UrlHelper, "setHrefUrl" );

        const adobeIdData = createAdobeIdData();

        const {
            api_parameters: apiParameters = {},
            client_id: clientId,
            redirect_uri: adobeIdRedirectUri,
            scope,
            locale,
        } = adobeIdData;
        const csrf = new CsrfService( clientId );

        spyOn( csrf, "initialize" ).and.callFake( function () {
            return "";
        } );

        const nonce = csrf.initialize();
        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
            },
            scope,
            locale,
            response_type: "token",
            state: {
                nonce,
            },
        };

        new SignInService().signIn( authorizeRequestData );
        expect( infoSpy ).toHaveBeenCalledWith(
            redirectUriMatching( {
                auto: "true",
                client_id: "IMSLibJSTestClient",
                scope: "adobeid",
                locale: "ro",
                response_type: "token",
                state: JSON.stringify( { nonce } ),
                jslVersion: Environment.jslibver,
                redirectParams: {
                    from_ims: "true",
                    client_id: "IMSLibJSTestClient",
                    api: "authorize",
                    scope: "adobeid",
                    old_hash: "",
                },
            } )
        );
    } );

    it( "execute the sign in command ", () => {
        const infoSpy = spyOn( UrlHelper, "setHrefUrl" );

        const adobeIdData = createAdobeIdData();

        const {
            api_parameters: apiParameters = {},
            client_id: clientId,
            redirect_uri: adobeIdRedirectUri,
            scope,
            locale,
        } = adobeIdData;
        const csrf = new CsrfService( clientId );

        spyOn( CsrfService, "generateNonce" ).and.callFake( function () {
            return {
                value: "nonce2",
                expiry: ( new Date().getTime() - 3600 ).toString(),
            };
        } );
        const nonce = csrf.initialize();

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
            },
            scope,
            locale,
            response_type: "token",
            state: {
                nonce,
            },
        };

        new SignInService().signIn( authorizeRequestData );
        expect( infoSpy ).toHaveBeenCalledWith(
            redirectUriMatching( {
                auto: "true",
                client_id: "IMSLibJSTestClient",
                scope: "adobeid",
                locale: "ro",
                response_type: "token",
                state: JSON.stringify( { nonce: "nonce2" } ),
                jslVersion: Environment.jslibver,
                redirectParams: {
                    from_ims: "true",
                    client_id: "IMSLibJSTestClient",
                    api: "authorize",
                    scope: "adobeid",
                    old_hash: "",
                },
            } )
        );
    } );

    it( "execute the sign in command with locale value in external parameters ", () => {
        const infoSpy = spyOn( UrlHelper, "setHrefUrl" );

        const adobeIdData = createAdobeIdData();

        const {
            api_parameters: apiParameters = {},
            client_id: clientId,
            redirect_uri: adobeIdRedirectUri,
            scope,
            locale,
        } = adobeIdData;
        const csrf = new CsrfService( clientId );

        spyOn( CsrfService, "generateNonce" ).and.callFake( function () {
            return {
                value: "nonce2",
                expiry: ( new Date().getTime() - 3600 ).toString(),
            };
        } );
        const nonce = csrf.initialize();

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
                locale: "localeexternal",
            },
            scope,
            locale,
            response_type: "token",
            state: {
                nonce,
            },
        };

        new SignInService().signIn( authorizeRequestData );
        expect( infoSpy ).toHaveBeenCalledWith(
            redirectUriMatching( {
                auto: "true",
                client_id: "IMSLibJSTestClient",
                scope: "adobeid",
                locale: "localeexternal",
                response_type: "token",
                state: JSON.stringify( { nonce: "nonce2" } ),
                jslVersion: Environment.jslibver,
                redirectParams: {
                    from_ims: "true",
                    client_id: "IMSLibJSTestClient",
                    api: "authorize",
                    scope: "adobeid",
                    old_hash: "",
                },
            } )
        );
    } );

    it( "execute the authorizeToken ", () => {
        const adobeIdData = createAdobeIdData();

        const {
            api_parameters: apiParameters = {},
            client_id: clientId,
            redirect_uri: adobeIdRedirectUri,
            scope,
            locale,
        } = adobeIdData;
        const csrf = new CsrfService( clientId );

        spyOn( CsrfService, "generateNonce" ).and.callFake( function () {
            return {
                value: "nonce2",
                expiry: ( new Date().getTime() - 3600 ).toString(),
            };
        } );
        const nonce = csrf.initialize();

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
            },
            scope,
            locale,
            response_type: "token",
            state: {
                nonce,
            },
        };

        const signInService = new SignInService();
        const createAuthorizeFormSpy = spyOn<any>(
            signInService,
            "createAuthorizeForm"
        ).and.callThrough();

        signInService.authorizeToken( "token", authorizeRequestData );
        expect( createAuthorizeFormSpy ).toHaveBeenCalledWith( {
            auto: true,
            client_id: "IMSLibJSTestClient",
            scope: "adobeid",
            locale: "ro",
            response_type: "token",
            jslVersion: Environment.jslibver,
            redirect_uri:
        "http://localhost:9235/#old_hash=&from_ims=true?client_id=IMSLibJSTestClient&api=authorize&scope=adobeid",
            state: { nonce: "nonce2" },
            user_assertion: "token",
            user_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        } );
    } );

    it( "execute the authorizeToken without token", () => {
        const adobeIdData = createAdobeIdData();

        const {
            api_parameters: apiParameters = {},
            client_id: clientId,
            redirect_uri: adobeIdRedirectUri,
            scope,
            locale,
        } = adobeIdData;
        const csrf = new CsrfService( clientId );

        spyOn( CsrfService, "generateNonce" ).and.callFake( function () {
            return {
                value: "nonce2",
                expiry: ( new Date().getTime() - 3600 ).toString(),
            };
        } );
        const nonce = csrf.initialize();

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
            },
            scope: '',
            locale,
            response_type: "token",
            state: {},
        };

        const signInService = new SignInService();
        const createAuthorizeFormSpy = spyOn<any>(
            signInService,
            "createAuthorizeForm"
        ).and.callThrough();

        signInService.authorizeToken( "", authorizeRequestData );
        expect( createAuthorizeFormSpy ).toHaveBeenCalledWith( {
            auto: true,
            client_id: "IMSLibJSTestClient",
            scope: "",
            locale: "ro",
            response_type: "token",
            jslVersion: Environment.jslibver,
            redirect_uri:
        "http://localhost:9235/#old_hash=&from_ims=true?client_id=IMSLibJSTestClient&api=authorize",
            state: { },
        } );
    } );
} );
