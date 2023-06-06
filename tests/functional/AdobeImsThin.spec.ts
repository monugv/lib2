import { AdobeIMSThin } from '../../src/adobe-ims/AdobeIMSThin';
import { AdobeIdKey, AdobeImsFactory } from "../../src/constants/ImsConstants";
import Main from '../../src/Main';
import { IAdobeIdData } from '../../src/adobe-id/IAdobeIdData';
import UrlHelper from '../../src/url/UrlHelper';
import UriTestHelper from '../helpers/uri-test-helper';
import { redirectUriMatching } from '../matchers/adobe.matcher';
import { IEnvironment } from '../../src/adobe-id/IEnvironment';
import { IReauth } from '../../src/adobe-ims/facade/IReauth';
import Environment from '../../src/adobe-ims/environment/Environment';
import { IGrantTypes } from '../../src/adobe-ims/facade/IGrantTypes';

let adobeIdDataValues: IAdobeIdData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'AdobeID,openid',
    api_parameters: { test: 1 },
    onAccessToken: jasmine.createSpy(),
    onAccessTokenHasExpired: jasmine.createSpy(),
    onReauthAccessToken: jasmine.createSpy(),
    onReady: jasmine.createSpy(),
    onError: jasmine.createSpy(),
    environment: IEnvironment.STAGE,
};

const createImsThin = ( adobeData: IAdobeIdData = adobeIdDataValues ): AdobeIMSThin => new AdobeIMSThin( adobeData );

describe( 'signIn method', () => {
    it( 'Url helper is called', async () => {
        const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );

        const nonce = 'nonce4';
        const state = { external: true };

        const adobeIMS = createImsThin();
        await adobeIMS.signIn( {
            external1: true,
        }, nonce, state );

        expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            external1: 'true',
            client_id: 'IMSLibJSTestClient',
            scope: 'AdobeID,openid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            state: JSON.stringify( {
                context: state,
                jslibver: Environment.jslibver,
                nonce,
            } ),
            redirectParams:
            {
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'AdobeID,openid',
                old_hash: '',
            }
        } ) );

    } );

    it( 'Sign in with external parameters', async () => {
        const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
        const state = {
            external: true,
            authorize: 'testauth'
        };

        const adobeIMS = createImsThin();
        await adobeIMS.signIn( {}, 'nonce3', state );

        expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            client_id: 'IMSLibJSTestClient',
            scope: 'AdobeID,openid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            state: JSON.stringify( {
                context: state,
                jslibver: Environment.jslibver,
                nonce: 'nonce3',
            } ),
            redirectParams:
            {
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'AdobeID,openid',
                old_hash: '',
                
            }
        } ) );

    } );


    it( 'Sign in with external parameters and grant type equal code', async () => {
        const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
        const state = {
            external: true,
            authorize: 'testauth'
        };

        const adobeIMS = createImsThin();
        await adobeIMS.signIn( {}, 'nonce3', state, IGrantTypes.code );

        expect( replaceUrlSpy ).toHaveBeenCalled();

    } );

} );

describe( 'signOut method', () => {

    beforeEach( () => {

        adobeIdDataValues.onAccessToken = null;
        adobeIdDataValues.onAccessTokenHasExpired = null;

        adobeIdDataValues = {
            ...adobeIdDataValues,
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReady: jasmine.createSpy()
        };
    } );

    it( 'Url helper is called', () => {

        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );

        const adobeIMSFlowInstance = createImsThin();

        adobeIMSFlowInstance.signOut( {
            context: {
                external: true
            }
        } );

        expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            client_id: 'IMSLibJSTestClient',
            context: '{"external":true}',
            jslVersion: Environment.jslibver,
            redirectParams:
            {
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'logout',
                old_hash: '',
            }
        } ) );
    } );

    it( 'Sign out using external parameters', () => {

        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );

        const adobeIMSFlowInstance = createImsThin();

        adobeIMSFlowInstance.signOut( {
            context: {
                external: true,
            },
            logout: 'logout_param'
        } );

        expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
            logout: 'logout_param',
            client_id: 'IMSLibJSTestClient',
            context: '{"external":true}',
            jslVersion: Environment.jslibver,
            redirectParams:
            {
                client_id: 'IMSLibJSTestClient',
                api: 'logout',
                from_ims: 'true',
                old_hash: '',
            }
        } ) );
    } );

} );

describe( 'constructor', () => {

    beforeAll( function () {
        Main.initialize();
    } );

    const imsWndKey = 'ims1';

    it( 'throws error in case the AdobeIdData is empty', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;

        expect( () => new AdobeIMSThin() ).toThrowError( 'Please provide required adobeId, client_id information' );

        window[AdobeIdKey] = adobeIdData;
    } );

    it( 'throws error in case the clientId is empty', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = {
            scope : "testScope"
        };

        expect( () => new AdobeIMSThin() ).toThrowError( 'Please provide required adobeId, client_id information' );

        window[AdobeIdKey] = adobeIdData;
    } );

    it( 'it create a AdobeIMs instance in case the AdobeIdData is passed', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;

        expect( () => new AdobeIMSThin( adobeIdData ) ).not.toBeNull();

        window[AdobeIdKey] = adobeIdData;
    } );

    it( 'it create a AdobeIMs instance based on factory', () => {
        const imsFactory = window[AdobeImsFactory];

        const imsInstance = imsFactory.createIMSLib( null, imsWndKey );

        expect( imsInstance ).not.toBeNull();

        const wndImsInstance = window[imsWndKey];
        expect( wndImsInstance ).not.toBeNull();
    } );

    it( 'it create a AdobeIMs instance based on factory with AdobeId data', () => {
        const imsFactory = window[AdobeImsFactory];
        const imsInstance = imsFactory.createIMSLib( adobeIdDataValues, imsWndKey );

        expect( imsInstance ).not.toBeNull();

        const wndImsInstance = window[imsWndKey];
        expect( wndImsInstance ).not.toBeNull();
    } );
} );

describe( 'getAuthorizationUrl', () => {

    it( 'getAuthorizationUrl should generarte a good url', async () => {
        const nonce = 'nonce4';
        const state = { external: true };

        const adobeIMS = createImsThin();
        const authorizationURL = await adobeIMS.getAuthorizationUrl( {
            external1: true,
        }, nonce, state );

        const urlObject = UriTestHelper.createObjectFromUrl( authorizationURL );

        expect( urlObject ).toEqual( {
            external1: 'true',
            client_id: 'IMSLibJSTestClient',
            scope: 'AdobeID,openid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            state: JSON.stringify( {
                context: state,
                jslibver: Environment.jslibver,
                nonce,
            } ),
            redirectParams:
            {
                from_ims: 'true',
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'AdobeID,openid',
                old_hash: '',
            }
        } );

    } );

} );



describe( 'get authorization url', () => {

    it( 'get social provider', async () => {

        const adobeIMSFlowInstance = createImsThin();

        const url = await adobeIMSFlowInstance.getSocialProviderAuthorizationUrl( 'google' );
        const objUrl = UriTestHelper.redirectUrlToObject( url );

        expect( objUrl ).toEqual( { 
            idp_flow: 'social.deep_link.web',
            provider_id: 'google',
            client_id: 'IMSLibJSTestClient',
            scope: 'AdobeID,openid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            redirect_uri: 'http://localhost:9235/#old_hash=&from_ims=true?client_id=IMSLibJSTestClient&api=authorize&scope=AdobeID,openid',
            state: JSON.stringify( {
                jslibver: Environment.jslibver,
                nonce: '',
            } ) 
        } );
    } );

    it( 'getReauthenticateAuthorizationUrl', async () => {

        const adobeIMSFlowInstance = createImsThin();

        const url = await adobeIMSFlowInstance.getReauthenticateAuthorizationUrl( IReauth.force );
        const objUrl = UriTestHelper.redirectUrlToObject( url );

        expect( objUrl ).toEqual( 
            { reauth: 'force',
                client_id: 'IMSLibJSTestClient',
                scope: 'AdobeID,openid',
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                redirect_uri: 'http://localhost:9235/#old_hash=&from_ims=true?client_id=IMSLibJSTestClient&api=authorize&scope=AdobeID,openid&reauth=force',
                state: JSON.stringify( {
                    jslibver: Environment.jslibver,
                    nonce: '',
                } ), 
            }
        );
    } );


    it( 'getSignUpAuthorizationUrl', async () => {

        const adobeIMSFlowInstance = createImsThin();

        const url = await adobeIMSFlowInstance.getSignUpAuthorizationUrl();
        const objUrl = UriTestHelper.redirectUrlToObject( url );

        expect( objUrl ).toEqual( {
            idp_flow: 'create_account', 
            client_id: 'IMSLibJSTestClient', 
            scope: 'AdobeID,openid', locale: 'ro', 
            response_type: 'token', 
            jslVersion: Environment.jslibver,
            redirect_uri: 'http://localhost:9235/#old_hash=&from_ims=true?client_id=IMSLibJSTestClient&api=authorize&scope=AdobeID,openid',
            state: JSON.stringify( {
                jslibver: Environment.jslibver,
                nonce: '',
            } ), 
        } );
            
    } );

} );


