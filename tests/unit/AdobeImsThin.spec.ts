import { AdobeIMSThin } from '../../src/adobe-ims/AdobeIMSThin';
import Environment from '../../src/adobe-ims/environment/Environment';
import { IEnvironment } from "../../src/adobe-id/IEnvironment";
import { IReauth } from '../../src/adobe-ims/facade/IReauth';
import { AdobeIdKey } from "../../src/constants/ImsConstants";
import UrlHelper from '../../src/url/UrlHelper';
import UriTestHelper from '../helpers/uri-test-helper';
import adobeIdDataValues from "./test-data";

describe( 'signIn method', () => {

    it( 'verifies the version', () => {
        const adobeIMS = new AdobeIMSThin();
        expect( adobeIMS.signIn ).toBeDefined();
    } );

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

describe( 'initialize', () => {
    it( 'calls getToken on initialize', () => {
        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        adobeIMS.initialize();

        expect( newAdobeIdValues.onReady ).toHaveBeenCalled();

    } );

} );


describe( 'signin', () => {
    it( 'calls signin', async () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const urlHelperSpy = spyOn( UrlHelper, 'setHrefUrl' );
        await adobeIMS.signIn( {}, 'nonce', { context:1 } );

        expect( urlHelperSpy ).toHaveBeenCalled();


    } );

} );


describe( 'getAuthorizationUrl', () => {
    it( 'calls getAuthorizationUrl', async () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };
        const nonce = 'nonce4';
        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const authUrl = await adobeIMS.getAuthorizationUrl( {}, nonce, { context:1 } );
        const response = UriTestHelper.createObjectFromUrl( authUrl );
        delete response.state;

        expect( response ).toEqual( {
            client_id: newAdobeIdValues.client_id,
            scope: 'adobeid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            redirectParams: { old_hash: '', from_ims: 'true', client_id: newAdobeIdValues.client_id, api: 'authorize', scope: 'adobeid' }
        } );
    } );

} );


describe( 'getSocialProviderAuthorizationUrl', () => {
    it( 'calls getSocialProviderAuthorizationUrl', async () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const authUrl = await adobeIMS.getSocialProviderAuthorizationUrl( 'provider', {}, { context:1 } );
        const response = UriTestHelper.createObjectFromUrl( authUrl );
        delete response.state;

        expect( response ).toEqual( {
            idp_flow: 'social.deep_link.web',
            provider_id: 'provider',
            client_id: newAdobeIdValues.client_id,
            scope: 'adobeid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            redirectParams: { old_hash: '', from_ims: 'true', client_id: newAdobeIdValues.client_id, api: 'authorize', scope: 'adobeid' }
        } );
    } );

} );

describe( 'getReauthenticateAuthorizationUrl', () => {
    it( 'calls getReauthenticateAuthorizationUrl', async () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const authUrl = await adobeIMS.getReauthenticateAuthorizationUrl( IReauth.check, {}, { context:1 } );
        const response = UriTestHelper.createObjectFromUrl( authUrl );
        delete response.state;

        expect( response ).toEqual( {
            reauth: 'check',
            client_id: newAdobeIdValues.client_id,
            scope: 'adobeid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            redirectParams: { old_hash: '', from_ims: 'true', client_id: newAdobeIdValues.client_id, api: 'authorize', scope: 'adobeid', reauth: 'check' }
        } );
    } );

} );

describe( 'getSignUpAuthorizationUrl', () => {
    it( 'calls getSignUpAuthorizationUrl', async () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const authUrl = await adobeIMS.getSignUpAuthorizationUrl( {}, { context:1 } );
        const response = UriTestHelper.createObjectFromUrl( authUrl );
        delete response.state;

        expect( response ).toEqual( {
            idp_flow: 'create_account',
            client_id: newAdobeIdValues.client_id,
            scope: 'adobeid',
            locale: 'ro',
            response_type: 'token',
            jslVersion: Environment.jslibver,
            redirectParams: { old_hash: '', from_ims: 'true', client_id: newAdobeIdValues.client_id, api: 'authorize', scope: 'adobeid' }
        } );
    } );

} );

describe( 'sign out', () => {
    it( 'calls sign out', () => {

        const tokenInfo = {
            token: "token",
            expire: new Date(),
            sid: "sid",
        };

        Environment.loadEnvironment( IEnvironment.STAGE )

        const newAdobeIdValues = {
            ...adobeIdDataValues,
            useLocalStorage: true,
            autoValidateToken: true,
            standalone: { ...tokenInfo, expirems: 6000 },
            onAccessToken: jasmine.createSpy(),
            onAccessTokenHasExpired: jasmine.createSpy(),
            onReauthAccessToken: jasmine.createSpy(),
            onReady: jasmine.createSpy(),
            onError: jasmine.createSpy(),
        };

        const adobeIMS = new AdobeIMSThin( newAdobeIdValues );

        const urlHelperSpy = spyOn( UrlHelper, 'replaceUrl' );
        adobeIMS.signOut( {} );

        expect( urlHelperSpy ).toHaveBeenCalled();

    } );

} );

describe( 'get nonce', () => {
    it( 'nonce', () => {
        const adobeIMS = new AdobeIMSThin( );
        const response = adobeIMS.getNonce();

        expect( response ).toEqual( null );

    } );

} );
