import { ImsApis } from './../../src/ims-apis/ImsApis';

import Debouncer from '../../src/debounce/Debouncer';
import { HttpErrorResponse } from '../../src/error-handlers/HttpErrorResponse';
import Xhr from '../../src/ims-apis/xhr/Xhr';
import ImsXhr from '../../src/ims-apis/xhr/ImsXhr';
import Environment from '../../src/adobe-ims/environment/Environment';
import { IEnvironment } from "../../src/adobe-id/IEnvironment";
import anything = jasmine.anything;
import stringMatching = jasmine.stringMatching;

const imsApi = new ImsApis( );
const VALIDATE_TOKEN_API = 'https://ims-na1-stg1.adobelogin.com/ims/validate_token/v1';

describe( 'Ims Apis', () => {

    beforeEach( function () {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
    } )


    it( 'list social providers', ( done ) => {

        const response = [1, 2, 3];
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: response
            } );
        } );

        imsApi.listSocialProviders( {
            client_id: 'IMSLibJSTestClient'
        } )
            .then ( v => {
                expect( v ).toEqual( response );
                done();
            } )

    } )

    it( 'validateToken', ( done ) => {

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.validateToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).then( v => {
            expect( v ).toEqual( {} )
            done();
        } )

    } )

    it( 'get profile', ( done ) => {

        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.getProfile( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )

    it( 'getUserInfo', ( done ) => {
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.getUserInfo( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )


    it( 'logoutToken', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data,  config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.logoutToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )


    it( 'checkStatus', ( done ) => {
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string,  config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.checkStatus().then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )


    it( 'checkToken', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.checkToken( {
            client_id: 'IMSLibJSTestClient'
        }, {
            test: 1
        },
        'scope' ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )

    it( 'checkToken with user_id', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        const xhrPostSpy = spyOn( ImsXhr, 'post' ).and.callThrough();

        const url = `https://adobeid-na1-stg1.services.adobe.com/ims/check/v6/token?jslVersion=${Environment.jslibver}`;

        const headers = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8', 'client_id' : 'IMSLibJSTestClient' };

        imsApi.checkToken( {
            client_id: 'IMSLibJSTestClient',
            scope: 'adobeid',
        }, {
            test: 1
        },
        'userId' ).then ( v => {
            expect( xhrPostSpy ).toHaveBeenCalledWith( url, 'test=1&client_id=IMSLibJSTestClient&scope=adobeid&user_id=userId', headers );
            done();
        } )

    } )

    it( 'checkToken from proxied domain - stage', ( done ) => testProxiedCheckToken(
        done, IEnvironment.STAGE, 'net.s2stagehance.com', 'https://sso.s2stagehance.com'
    ) )

    it( 'checkToken from proxied domain - prod', ( done ) => testProxiedCheckToken(
        done, IEnvironment.PROD, 'www.behance.net', 'https://sso.behance.net'
    ) )

    it( 'checkToken from non-proxied domain', ( done ) => testProxiedCheckToken(
        done, IEnvironment.STAGE, 'web.iana.org', 'https://adobeid-na1-stg1.services.adobe.com'
    ) )

    it( 'checkToken from proxied domain - different env', ( done ) => testProxiedCheckToken(
        done, IEnvironment.STAGE, 'www.behance.net', 'https://adobeid-na1-stg1.services.adobe.com'
    ) )

    it( 'checkToken from proxied domain - JS flag not set', ( done ) => testProxiedCheckToken(
        done, IEnvironment.STAGE, 'net.s2stagehance.com', 'https://adobeid-na1-stg1.services.adobe.com', false
    ) )

    function testProxiedCheckToken( done, actualEnv, actualDomain, expectedBaseUrl, jsFlag = true ) {
        const expectedUrl = `${expectedBaseUrl}/ims/check/v6/token?jslVersion=${Environment.jslibver}`

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        const xhrPostSpy = spyOn( ImsXhr, 'post' ).and.callThrough();
        const headers = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8', 'client_id' : 'IMSLibJSTestClient' };

        loadEnvironmentFromThirdPartyDomain( actualEnv, actualDomain, jsFlag )
        imsApi.checkToken( {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid'
            }, {}, '').then ( v => {
            expect( xhrPostSpy )
                .toHaveBeenCalledWith( expectedUrl, 'client_id=IMSLibJSTestClient&scope=adobeid', headers );
            done();
        } ).finally( () => resetEnvironment() )
    }

    function loadEnvironmentFromThirdPartyDomain( env, thirdPartyDomain, jsFlag ) {
        Environment.loadEnvironment( env, jsFlag, thirdPartyDomain )
    }

    function resetEnvironment() {
        Environment.loadEnvironment( IEnvironment.STAGE, false, 'www.adobe.com' )
    }

    it( 'checkToken from proxied domain fallback to Adobe', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            if(url.includes('s2stagehance')) {
                return Promise.reject( {
                    status: 404,
                    data: {
                        error: 'feature_disabled',
                        error_description: 'cdsc'
                    }
                } );
            }

            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: 'lol'
                }
            } );
        } );

        loadEnvironmentFromThirdPartyDomain( IEnvironment.STAGE, 'net.s2stagehance.com' , true )
        imsApi.checkToken( {
                client_id: 'IMSLibJSTestClient'
            }, {
                test: 1
            },
            'scope' ).then ( v => {
            expect( v ).toEqual( {access_token: 'lol'} );
            expect( Xhr.post ).toHaveBeenCalledTimes(2)
            expect( Xhr.post ).toHaveBeenCalledWith(stringMatching(/sso.s2stagehance.com/), anything(), anything())
            expect( Xhr.post ).toHaveBeenCalledWith(stringMatching(/stg1.services.adobe.com/), anything(), anything())
            done();
        } ).finally( () => resetEnvironment() )
    } )

    it( 'switch profile', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.switchProfile( {
            client_id: 'IMSLibJSTestClient'
        }, {
            test: 1
        },
        'clientid' ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )

    it( 'listSocialProviders', ( done ) => {
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string,  config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        imsApi.listSocialProviders( {
            client_id: 'IMSLibJSTestClient',
        } ).then ( v => {
            expect( v ).toEqual( {} );
            done();
        } )

    } )

    it( 'exchangeIjt', ( done ) => {

        const ijtUrl = 'https://adobeid-na1-stg1.services.adobe.com/ims/jump/implicit/ijtvalue?client_id=IMSLibJSTestClient';
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { age:1 },
            } );

        } );

        imsApi.exchangeIjt( {
            client_id: 'IMSLibJSTestClient'
        }, 'ijtvalue' ).then( v => {
            expect( v ).toEqual( { age: 1 } );
            done();
        } )
            .catch( v => {
                expect( v ).toEqual( { age: 1 } );
                done();
            } )

    } )

    it( 'avatarUrl', ( done ) => {
        const url = imsApi.avatarUrl( 'userid' );

        expect( url ).toBe( 'https://ims-na1-stg1.adobelogin.com/ims/avatar/download/userid' );

        done();
    } )

    it( 'validateToken fails and interceptor is called with network error', ( done ) => {

        const imsApis = new ImsApis(  );

        spyOn( Xhr, 'post' ).and.callFake( function () {
            return Promise.reject( {
                error: 'networkError',
                message: 'Network Error',
                code: 0,
                status: 0
            } );
        } )

        imsApis.validateToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).catch( error => {

            expect( error ).toEqual( new HttpErrorResponse( {
                error: 'networkError',
                message: '',
                retryAfter: 0
            } ) );
            done();
        } );

    } );

    it( 'validateToken fails and interceptor is called with code 429', ( done ) => {

        const imsApis = new ImsApis( );
        spyOn( Xhr, 'post' ).and.callFake( function () {
            return Promise.reject( {
                status: 429,
                data: { header: { retryAfter: 10 } }
            } );
        } )

        imsApis.validateToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).catch( error => {
            expect( error ).toEqual( new HttpErrorResponse( {
                error: 'rate_limited',
                retryAfter: 10,
            } ) );
            done();
        } );

    } );

    it( 'validateToken fails and interceptor is called with code 5xx', ( done ) => {

        const imsApis = new ImsApis( );
        spyOn( Xhr, 'post' ).and.callFake( function (  url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 500,
                data: {}
            } )

        } );

        imsApis.validateToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).catch( error => {
            expect( error ).toEqual( new HttpErrorResponse( {
                error: 'server_error',
                code: 500
            } ) );
            done();
        } )

    } );

    it( 'calls the social headless sign in API', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );

        const xhrPostSpy = spyOn( ImsXhr, 'post' ).and.callThrough();

        const url = `https://adobeid-na1-stg1.services.adobe.com/ims/social/v2/native?jslVersion=${Environment.jslibver}`;
        const encodedData = 'test=1&client_id=IMSLibJSTestClient&scope=adobeid&provider_id=google&idp_token=fake_token&accepted_tou_list=%5B%22ADOBE_MASTER%22%2C%22ANOTHER_TOU%22%5D&state=%7B%22nonce%22%3A%22some_nonce%22%7D&response_type=implicit_jump';
        const contentType = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8' };

        imsApi.socialHeadlessSignIn( {
            client_id: 'IMSLibJSTestClient',
            scope: 'adobeid',
            provider_id: 'google',
            idp_token: 'fake_token',
            accepted_tou_list:['ADOBE_MASTER', 'ANOTHER_TOU'],
            state:{ nonce: 'some_nonce' }
        }, {
            test: 1
        } ).then ( () => {
            expect( xhrPostSpy ).toHaveBeenCalledWith( url, encodedData, contentType );
            done();
        } )

    } );

} );
