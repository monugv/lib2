import { RedirectHelper } from '../../src/adobe-ims/helpers/RedirectHelper';
import { AdobeIdData } from '../../src/adobe-id/AdobeIdData';

import adobeIdData from './test-data';
import { IRedirectRequest } from '../../src/adobe-ims/facade/IRedirectRequest';
import { hashMatching } from '../matchers/adobe.matcher';
import { IDictionary } from '../../src/facade/IDictionary';

const createAdobeIdData = ( overrideParams = {}, data = adobeIdData ): AdobeIdData => new AdobeIdData( { ...data, ...overrideParams } );


describe( 'RedirectHelper --> Authorize', () => {

    it( 'create authorize url ', () => {

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: '',
            from_ims: 'true',
        } ) );

        expect( params.indexOf( 'old_hash=&from_ims=true' ) ).toBeGreaterThan( -1 );
    } );

    it( 'create authorize url when from_ims exists in url ', () => {

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri: 'https://test.com&test=1#from_ims=true&old_hash=&api=authorize#access_token=eyJ4N',
            apiParameters,
            clientId,
            externalParameters: {
                auto: true
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: '',
            from_ims: 'true',
        } ) );

        expect( params.indexOf( 'old_hash=&from_ims=true' ) ).toBeGreaterThan( -1 );
    } );

    it( 'state is not part of redirect url in case the external parameters is empty ', () => {

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: '',
            from_ims: 'true',
        } ) );
    } );

    it( 'state is not part of redirect url in case the external parameters is not empty ', () => {

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true,
                test: 1
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: '',
            from_ims: 'true',
        } ) );
    } );

    it( 'create a new instance of SignInRequest when url already contains #', () => {
        const href = window.location.href;
        window.location.replace( `${ href }#h1=h1v&h2=h2v` );

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: 'h1=h1v&h2=h2v',
            from_ims: 'true',
        } ) );
    } );

    it( 'create a new instance of SignInRequest when url already contains # and client id is from external', () => {
        const href = window.location.href;
        window.location.replace( `${ href }#h1=h1v&h2=h2v` );

        const adobeIdData = createAdobeIdData();

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auth0: true,
                auth1: false,
                test: 'yes',
                client_id: '12345'
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toEqual( hashMatching( {
            client_id: 'IMSLibJSTestClient',
            api: 'authorize',
            scope: 'adobeid',
            old_hash: 'h1=h1v&h2=h2v#h1=h1v&h2=h2v',
            from_ims: 'true',
        } ) );
    } );

    // test fix for https://jira.corp.adobe.com/browse/SUSI-15925
    it( 'merge api params', () => {      
        const apiParameters: IDictionary = { authorize: { foo:'bar', state:{ ac:'xd.adobe.com', some:'prop' } } };
        const externalParameters: IDictionary = { foo: 'baz', state:{ some:'other-prop' } };

        const params = RedirectHelper.mergeApiParamsWithExternalParams( apiParameters, externalParameters, 'authorize' );

        expect( params ).toEqual( {
            foo: 'baz',
            state: {
                ac: 'xd.adobe.com',
                some: 'other-prop'
            }
        } );
    } );

    // test implementation for https://jira.corp.adobe.com/browse/SUSI-16640
    it( 'create authorize url when redirect uri is a function ', () => {

        const adobeIdData = new AdobeIdData();
        adobeIdData.redirect_uri = (): string => `${window.location.href}?someProp=someValue`;

        const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri, scope, locale } = adobeIdData;

        const authorizeRequestData: IRedirectRequest = {
            adobeIdRedirectUri,
            apiParameters,
            clientId,
            externalParameters: {
                auto: true
            },
            scope,
            locale,
            response_type: 'token',
            state: null,
        };

        const params = RedirectHelper.createRedirectUrl( authorizeRequestData.adobeIdRedirectUri, authorizeRequestData.clientId,
            authorizeRequestData.externalParameters, 'authorize', authorizeRequestData.scope );

        expect( params ).toContain( "someProp=someValue" );
    } );

} );
