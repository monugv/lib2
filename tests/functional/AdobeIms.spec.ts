import { AdobeIMS } from '../../src/adobe-ims/AdobeIMS';
import { AdobeIdKey, AdobeImsFactory, ON_IMSLIB_INSTANCE } from "../../src/constants/ImsConstants";
import Main from '../../src/Main';
import { IAdobeIdData } from '../../src/adobe-id/IAdobeIdData';
import UrlHelper from '../../src/url/UrlHelper';
import Log from '../../src/log/Log';
import TokenHelper from './../helpers/token-helper';
import { redirectUriMatching } from '../matchers/adobe.matcher';
import { CsrfService, ONE_HOUR } from '../../src/adobe-ims/csrf/CsrfService';
import uriTestHelper from '../helpers/uri-test-helper';
import { FragmentException } from '../../src/token/FragmentException';
import { IFragmentExceptionType } from '../../src/token/IFragmentExceptionType';
import FragmentHelper from '../../src/url/FragmentHelper';
import Debouncer from '../../src/debounce/Debouncer';
import { RideException } from '../../src/token/RideException';
import { IEnvironment } from '../../src/adobe-id/IEnvironment';
import { TokenExpiredException } from '../../src/token/TokenExpiredException';
import { HttpErrorResponse } from '../../src/error-handlers/HttpErrorResponse';
import { StandaloneToken } from '../../src/token/StandaloneToken';
import AnalyticsLibrary from '../helpers/AnalyticsLibrary';
import Environment from '../../src/adobe-ims/environment/Environment';
import Xhr from '../../src/ims-apis/xhr/Xhr';
import objectContaining = jasmine.objectContaining;
import { ITokenInformation } from "../../src/adobe-id/custom-types/CustomTypes";


const onErrorSpy = jasmine.createSpy();
const onAccessTokenSpy = jasmine.createSpy();

const resetAdobeIdDataValues = (): IAdobeIdData => {

    onErrorSpy.calls.reset();
    onAccessTokenSpy.calls.reset();

    const adobeValues: IAdobeIdData = {
        client_id: 'IMSLibJSTestClient',
        locale: 'ro',
        scope: 'adobeid',
        api_parameters: { test: 1 },
        onAccessToken: onAccessTokenSpy,
        onAccessTokenHasExpired: jasmine.createSpy(),
        onReauthAccessToken: jasmine.createSpy(),
        onReady: function () {
            window["onReady"] = 'on ready';
        },
        onError: onErrorSpy,
        environment: IEnvironment.STAGE,
        analytics: {
            appCode: "appcode",
            appVersion: "appVersion",
        }
    };

    return adobeValues;
}

let adobeIdDataValues: IAdobeIdData = resetAdobeIdDataValues();

const createAdobeIMS = ( adobeData: IAdobeIdData = adobeIdDataValues ): AdobeIMS => new AdobeIMS( adobeData );

const csrfService = new CsrfService( adobeIdDataValues.client_id );


const createAdobeImsInstance = ( onReadyFunction, onErrorFunction? ): AdobeIMS => {

    const adobeIdData = {
        ...adobeIdDataValues,
        onReady: onReadyFunction,
        onError: onErrorFunction
    }

    return createAdobeIMS( adobeIdData );
}

const createAdobeImsWithData = ( overrides ): AdobeIMS => createAdobeIMS( { ...adobeIdDataValues, ...overrides } );

const createAdobeImsInstanceAsPromise = ( onReadyFunction, onErrorFunction? ): Promise<AdobeIMS> => {

    const adobeInstance = createAdobeImsInstance( onReadyFunction, onErrorFunction );

    return adobeInstance.initialize().then( () => {
        return Promise.resolve( adobeInstance );
    } );
}

const navigateToIms = ( jwt = '', reauth = false, oldHash = '', state: unknown = 9 ): void => {
    const nonce = csrfService.initialize();

    const urlValue = `#access_token=${jwt}&client_id=${adobeIdDataValues.client_id}&scope=adobeid&api=authorize&reauth=${reauth}
    &old_hash=${oldHash}&from_ims=true&state=${encodeURIComponent( JSON.stringify( { nonce, context: state } ) )}`;
    UrlHelper.replaceUrl( urlValue );
};

const navigateToImsWithoutToken = ( oldHash = '' ): void => {

    const urlValue = `#client_id=${adobeIdDataValues.client_id}&scope=adobeid&api=authorize&reauth=false&old_hash=${oldHash}&from_ims=true`;
    UrlHelper.replaceUrl( urlValue );
};

const expires_in = '1000';
const startDateTokenFields = new Date();
const tokenFieldsData = TokenHelper.tokenFieldsData( startDateTokenFields );

UrlHelper.setHash = ( hash = '' ): void => {
    window.location.hash = hash;
}

const clearStorage = (): void => {
    window.sessionStorage.clear();
}

describe( 'initialize throws error', () => {
    function mockNetworkError (): void {
        spyOn( Xhr, 'get' ).and.callFake( () => Promise.reject( {
            status: null,
            data: [],
        } ) );
    }

    function expectErrorCallbackIsCalled ( errorCallbackCalled, done: DoneFn ): void {
        expect( errorCallbackCalled ).toBeTrue()
        done()
    }

    it( 'calls onError on initialize network error', ( done ) => {
        mockNetworkError();
        let errorCallbackCalled

        createAdobeImsInstanceAsPromise( () => null, () => errorCallbackCalled = true )
            .then( () => expectErrorCallbackIsCalled( errorCallbackCalled, done ) );
    } )
} )

describe( 'list social providers ', () => {

    it( 'social providers returns the providers array', ( done ) => {
        createAdobeImsInstanceAsPromise( () => null ).then( adobeIMS => {
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: [],
                } );
            } );
            adobeIMS.listSocialProviders().then( v => {
                expect( Array.isArray( v ) ).toBeTruthy();
                done();
            } );
        } )


    } );

    it( 'social providers throws error', ( done ) => {
        createAdobeImsInstanceAsPromise( () => null ).then( adobeIMS => {
            const exception = { error: 'network' };
            spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.reject( {
                    status: 404,
                    data: exception,
                } );
            } );

            adobeIMS.listSocialProviders()
                .catch( () => {
                    done();
                } );
        } )

    } );
} )

describe( 'not logged in', () => {
    it( 'user is NOT signed in after refresh if previously not logged in', ( done ) => {

        UrlHelper.replaceUrl( '#' );

        let additionalCheck: Function | null = null;

        const imsInstance = createAdobeImsInstance( () => null );
        additionalCheck = (): void => {
            expect( imsInstance.isSignedInUser() ).toEqual( false );
        }

        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        spyOn( imsInstance, 'refreshToken' ).and.callFake( function () {
            return Promise.resolve();
        } );

        imsInstance.initialize().then( () => {
            expect( adobeIdDataValues.onAccessToken ).not.toHaveBeenCalled();

            additionalCheck && additionalCheck();

            done();
        } )

    } );

} )

describe( 'tokenService.getToken throws exception', () => {
    it( 'NoTokenException', ( done ) => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );

        const imsInstance = createAdobeImsInstance( () => null );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        UrlHelper.replaceUrl( '#' );

        imsInstance.initialize().then( () => {
            expect( adobeIdDataValues.onAccessTokenHasExpired ).toHaveBeenCalled();

            done();
        } )
    } );

} );

describe( 'tokenService.getToken throws exception and url is updated to initial value', () => {
    it( 'NoTokenException', ( done ) => {

        const setHashSpy = spyOn( UrlHelper, 'setHash' );
        onErrorSpy.calls.reset();

        const imsInstance = createAdobeImsInstance( () => null );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        navigateToImsWithoutToken( 'newvalue' );

        imsInstance.initialize().then( () => {
            expect( setHashSpy ).toHaveBeenCalledWith( 'newvalue' );
            expect( adobeIdDataValues.onAccessTokenHasExpired ).toHaveBeenCalled();

            done();
        } )

    } );

} );


describe( 'signIn method', () => {
    it( 'Url helper is called', ( done ) => {

        const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
        createAdobeImsInstanceAsPromise( () => null ).then( async ( adobeIMS ) => {
            UrlHelper.setHash();

            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce6',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );
            const state = {
                external: true,
                test: 1
            };

            await adobeIMS.signIn( {
                external1: true,
            }, state );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                client_id:'IMSLibJSTestClient',
                external1:'true',
                jslVersion:Environment.jslibver,
                locale:'ro',
                redirectParams:{ old_hash: '', from_ims: 'true', client_id: 'IMSLibJSTestClient', api: 'authorize', scope: 'adobeid' },
                response_type:'token',
                scope:'adobeid',
                state: JSON.stringify( {
                    context: state,
                    ac: 'appcode',
                    av: 'appVersion',
                    jslibver: Environment.jslibver,
                    nonce: 'nonce6',
                } ),
            } ) );

            replaceUrlSpy.calls.reset();

            done();
        } )

    } );


    it( 'Sign in with existent hash', ( done ) => {

        const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
        createAdobeImsInstanceAsPromise( () => null ).then( async ( adobeIMS ) => {
            UrlHelper.setHash( 'test1=1&test2=2' );

            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce6',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );
            const state = {
                external: true,
                test: 1
            };

            await adobeIMS.signIn( {
                external1: true,
            }, state );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external1: 'true',
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                state: JSON.stringify( {
                    context: state,
                    ac: 'appcode',
                    av: 'appVersion',
                    jslibver: Environment.jslibver,
                    nonce: 'nonce6',
                } ),
                redirectParams:
                {
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'adobeid',
                    old_hash: 'test1=1&test2=2',
                }
            } ) );
            replaceUrlSpy.calls.reset();
            done();
        } );

    } );


    it( 'Sign in with external parameters', ( done ) => {
        createAdobeImsInstanceAsPromise( () => null ).then( async ( adobeIMS ) => {
            UrlHelper.setHash();
            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce5',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            const state = {
                external: true,
                authorize: 'testauth'
            };

            await adobeIMS.signIn( {
                external1: true,
                authorize1: 'testauth',
            }, state );


            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external1: 'true',
                authorize1: 'testauth',
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                state: JSON.stringify( {
                    context: state,
                    ac: 'appcode',
                    av: 'appVersion',
                    jslibver: Environment.jslibver,
                    nonce: 'nonce5',
                } ),
                redirectParams:
                {
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'adobeid',
                    old_hash: '',
                }
            } ) );

            replaceUrlSpy.calls.reset();
            done();
        } )

    } );

    it( 'Sign in with external parameters', ( done ) => {

        createAdobeImsInstanceAsPromise( () => null ).then( async ( adobeIMS ) => {
            UrlHelper.setHash( 'test=1&test1=test1' );
            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce5',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            const state = {
                external: true,
                authorize: 'testauth'
            };

            await adobeIMS.signIn( {
                external1: true,
                authorize1: 'testauth',
            }, state );


            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external1: 'true',
                authorize1: 'testauth',
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                state: JSON.stringify( {
                    context: state,
                    ac: 'appcode',
                    av: 'appVersion',
                    jslibver: Environment.jslibver,
                    nonce: 'nonce5',
                } ),
                redirectParams:
                {
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'adobeid',
                    old_hash: 'test=1&test1=test1',
                }
            } ) );

            replaceUrlSpy.calls.reset();
            done();
        } )

    } );

    it( 'sign in returns the access token', ( done ) => {

        const setHashSpy = spyOn( UrlHelper, 'setHash' );
        const profile = {
            name: 'profilename',
            userId: 'user_id',
        };
        const startDate = new Date();
        const jwt = TokenHelper.defaultToken( startDate );
        let additionalCheck: Function | null = null;

        const stateValue = 9;

        let domEventValue;
        window.addEventListener( ON_IMSLIB_INSTANCE, ( value ) => {
            domEventValue = value;
        }, false );

        const onReady = ( state ): void => {
            expect( state ).toEqual( stateValue );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();
            expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();

            expect( setHashSpy ).toHaveBeenCalled();

            additionalCheck && additionalCheck();

        }

        const imsInstance = createAdobeImsInstance( onReady );

        additionalCheck = (): void => {
            expect( imsInstance.isSignedInUser() ).toBe( true );

            imsInstance.getProfile().then( profileValue => {
                expect( profileValue ).toEqual( profile );
                expect( domEventValue.detail.clientId ).toEqual( 'IMSLibJSTestClient' );
                done();
            } )
        }


        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: profile,
            } );
        } );

        navigateToIms( jwt, false, '', stateValue );

        imsInstance.initialize();

    } );

    it( 'sign in should works correctly in case the contextToBePassedOnRedirect arg has nested url', ( done ) => {
        const profile = {
            name: 'profilename',
            userId: 'user_id',
        };
        const startDate = new Date();
        const jwt = TokenHelper.defaultToken( startDate );
        let additionalCheck: Function | null = null;

        const stateValue = {
            reason: {
                PROTOTYPE_DATA_SIGN_IN: {
                    manifestURL: "https://stage.domain.com/content/storage/id/urn:aaid:sc:US:b98gfgf12-cdfc?component_id=component1&api_key=MyKey1&access_token=145656541_urn:aaid:sc:US:bdfgt604a-88787-dfdfg-8787;public_76f20991bb",
                    linkTemplate: {
                        href: "https://stage.domain.com/content/storage/id/urn:aaid:sc:US:bfg88-87fg-878fg-fdgfg{;revision}{?component_id}",
                        data: {
                            api_key: "MyKey1",
                            access_token: "15656756741_urn:aaid:sc:US:fg98dfg-fg98-98fg;public_76f2efdg99dfg09fg89gh"
                        }
                    },
                    ownerId: "jhjh897h@AdobeID",
                    manifest: {
                        id: "urn:aaid:sc:US:kj-98-98gfh-98fgh"
                    },
                    invitationServiceAccessToken: ""
                },
                REDIRECT_REASON: "SIGNIN"
            }
        }

        let domEventValue;
        window.addEventListener( ON_IMSLIB_INSTANCE, ( value ) => {
            domEventValue = value;
        }, false );

        const onReady = ( state ): void => {
            expect( state ).toEqual( stateValue );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();

            additionalCheck && additionalCheck();
        }

        const imsInstance = createAdobeImsInstance( onReady );

        additionalCheck = (): void => {
            expect( imsInstance.isSignedInUser() ).toBe( true );

            imsInstance.getProfile().then( profileValue => {
                expect( profileValue ).toEqual( profile );
                expect( domEventValue.detail.clientId ).toEqual( 'IMSLibJSTestClient' );
                done();
            } )
        }


        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: profile,
            } );
        } );

        navigateToIms( jwt, false, '', stateValue );

        imsInstance.initialize();
    } );

    it( 'validateToken success', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: tokenFieldsData,
            } );
        } );

        imsInstance.validateToken()
            .then( ( validationResponse ) => {
                expect( validationResponse ).toEqual( true );
                done();
            } );
    } );
} );

describe( 'getProfile method', () => {

    it( 'getProfile returns the value from storage', ( done ) => {

        const imsInstance = createAdobeImsInstance( null );
        imsInstance.getProfile()
            .then( value => {
                expect( value ).toBeDefined();
                done();
            } )
    } );

    it( 'getProfile works with reauth token', ( done ) => {

        clearStorage();

        const profile = {
            name: 'profilename',
            userId: 'user_id'
        };
        const startDate = new Date();
        const token = TokenHelper.reauthToken( startDate );


        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            expect( config['Authorization'] ).toEqual( `Bearer ${token}` );
            return Promise.resolve( {
                status: 200,
                data: profile,
            } );
        } );

        navigateToIms( token, true );

        const imsInstance = createAdobeImsInstance( () => null );

        imsInstance.initialize().then( () => {
            expect( imsInstance.getReauthAccessToken() ).not.toBeNull();
            expect( imsInstance.getAccessToken() ).toBeNull();

            imsInstance.getProfile().then( profileValue => {
                expect( profileValue ).toEqual( profile );
                done();
            } )
        } )
    } )
} )

describe( 'signUp method', () => {

    it( 'Url helper is called', () => {
        createAdobeImsInstanceAsPromise( () => null ).then( async ( adobeIMS ) => {
            UrlHelper.setHash();

            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce6',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            const state = {
                external: true,
                idp_flow: 'create_account',
            }
            ;
            await adobeIMS.signUp( {
                external: true,
            }, state );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external: 'true',
                idp_flow: "create_account",
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                state: JSON.stringify( {
                    context: state,
                    ac: 'appcode',
                    av: 'appVersion',
                    jslibver: Environment.jslibver,
                    nonce: 'nonce6',
                } ),
                redirectParams:{
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'adobeid',
                    old_hash: '',
                }
            } ) );
            replaceUrlSpy.calls.reset();
        } )

    } );

} );

describe( 'signOut method', () => {

    it( 'execute the sign out command', ( done ) => {
        createAdobeImsInstanceAsPromise( () => null ).then( ( adobeIMS ) => {
            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any,  config: any = {} ) {
                return Promise.reject( {
                    status: 200,
                    data: {},
                } );
            } );


            adobeIMS.signOut( {
                external: true
            } );

            expect( adobeIMS.getAccessToken() ).toEqual( null );
            expect( adobeIMS.getReauthAccessToken() ).toEqual( null );

            done();
        } )

    } );

    it( 'Url helper is called', ( done ) => {

        createAdobeImsInstanceAsPromise( () => null ).then( ( adobeIMS ) => {
            const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );
            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {},
                } );
            } );

            adobeIMS.signOut( {
                external: true
            } );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external: 'true',
                client_id: 'IMSLibJSTestClient',
                jslVersion: Environment.jslibver,
                redirectParams: {
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'logout',
                    old_hash: '',
                }
            } ) );

            expect( adobeIMS.getAccessToken() ).toEqual( null );
            expect( adobeIMS.getReauthAccessToken() ).toEqual( null );

            replaceUrlSpy.calls.reset();

            done();
        } )


    } );


    it( 'Sign out using external parameters', ( done ) => {

        createAdobeImsInstanceAsPromise( () => null ).then( ( adobeIMS ) => {

            UrlHelper.setHash( 'test1=1&test2=2' );

            const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );

            const getAccessTokenMethod = adobeIMS.getAccessToken;

            adobeIMS.getAccessToken = () => {
                return { token: 'tokenValue', expire: new Date(), sid: 'session_identifier' };
            }

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {},
                } );
            } );

            adobeIMS.signOut( {
                external: true,
                logout: 'logout_param'
            } );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                external: 'true',
                logout: 'logout_param',
                client_id: 'IMSLibJSTestClient',
                jslVersion: Environment.jslibver,
                redirectParams:
                {
                    from_ims: 'true',
                    client_id: 'IMSLibJSTestClient',
                    api: 'logout',
                    old_hash: 'test1=1&test2=2',
                }
            } ) );

            adobeIMS.getAccessToken = getAccessTokenMethod;

            replaceUrlSpy.calls.reset();

            expect( adobeIMS.getAccessToken() ).toEqual( null );
            expect( adobeIMS.getReauthAccessToken() ).toEqual( null );


            done();
        } )


    } );

    it( 'it verifies the setStandAloneToken functionality, without impersonation flags', ( ) => {

        const imsInstance = createAdobeImsInstance( () => console.log( 'ready' ) );

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJJTVNMaWJKU1Rlc3RDbGllbnQiLCJ1c2VyX2lkIjoidXNlcl9pZCIsInNjb3BlIjoiYWRvYmVpZCIsImNyZWF0ZWRfYXQiOiIxNTk5MTM4NDU0OTAxIiwiZXhwaXJlc19pbiI6IjMwMDAxIiwidmFsaWQiOnRydWUsIm90aGVyIjp7fX0.kLrLFd8X7lRB0UCz_-Mjkg0Sy-EUCJfp1cWKXRsrdzk';

        imsInstance.setStandAloneToken( new StandaloneToken( {
            token,
            expirems: 60000,
        } ) );

        const storageToken = imsInstance.getAccessToken();
        expect( storageToken && storageToken.token ).toEqual( token );
        expect( storageToken && storageToken.isImpersonatedSession ).toEqual( false );
        expect( storageToken && storageToken.impersonatorId ).toEqual( '' );

    } );

    it( 'it verifies the setStandAloneToken functionality, with impersonation flags', ( ) => {

        const imsInstance = createAdobeImsInstance( () => console.log( 'ready' ) );

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJJTVNMaWJKU1Rlc3RDbGllbnQiLCJ1c2VyX2lkIjoidXNlcl9pZCIsInNjb3BlIjoiYWRvYmVpZCIsImNyZWF0ZWRfYXQiOiIxNTk5MTM4NDU0OTAxIiwiZXhwaXJlc19pbiI6IjMwMDAxIiwidmFsaWQiOnRydWUsIm90aGVyIjp7fSwiaW1wX2lkIjoiaW1wZXJzb25hdGVkVXNlckBBZG9iZUlEIiwiaW1wX3NpZCI6ImltcGVyc29uYXRlZFNlc3Npb25JZCJ9.FskFySSx3JltniBniomwfhS0cLqUZL0I3RLQAnOmSWg';

        imsInstance.setStandAloneToken( new StandaloneToken( {
            token,
            expirems: 60000,
        } ) );

        const storageToken = imsInstance.getAccessToken();
        expect( storageToken && storageToken.token ).toEqual( token );
        expect( storageToken && storageToken.isImpersonatedSession ).toEqual( true );
        expect( storageToken && storageToken.impersonatorId ).toEqual( 'impersonatedUser@AdobeID' );

    } );

} );

describe( 'initialize', () => {
    beforeEach( () => {
        adobeIdDataValues = resetAdobeIdDataValues();
    } );

    describe( 're authenticate', () => {
        it( 'onReauthAccessToken is triggered', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            const profile = {
                name: 'profilename',
                userId: 'user_id'
            };
            const startDate = new Date();
            const token = TokenHelper.reauthToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onReauthAccessToken ).toHaveBeenCalledWith(
                    {
                        token,
                        expire: jasmine.objectContaining( expectedExpireDate ),
                        sid: 'session_identifier',
                        impersonatorId: '',
                        isImpersonatedSession: false,
                        pbaSatisfiedPolicies: []
                    } );


                expect( setHashSpy ).toHaveBeenCalled();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            navigateToIms( token, true );

            imsInstance.initialize().then( () => {
                const reauthToken = imsInstance.getReauthAccessToken();
                expect( reauthToken ).not.toBeNull();

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            } )

        } );

        it( 'onAccessToken is triggered if token is not reauth', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            let additionalCheck: Function | null = null;

            const profile = {
                name: 'profilename',
                userId: 'user_id',
            };
            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token: jwt,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: []
                } );

                expect( setHashSpy ).toHaveBeenCalled();

                additionalCheck && additionalCheck();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            additionalCheck = (): void => {
                expect( imsInstance.isSignedInUser() ).toBe( true );

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            }
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            navigateToIms( jwt );

            imsInstance.initialize();
        } );

        it( 'onAccessToken should return token with impersonatorId and isImpersonatedSession fields', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            let additionalCheck: Function | null = null;

            const profile = {
                name: 'profilename',
                userId: 'user_id',
            };
            const startDate = new Date();
            const jwt = TokenHelper.impersonatedToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token: jwt,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: 'impersonator_id',
                    isImpersonatedSession: true,
                    pbaSatisfiedPolicies: []
                } );

                expect( setHashSpy ).toHaveBeenCalled();

                additionalCheck && additionalCheck();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            additionalCheck = (): void => {
                expect( imsInstance.isSignedInUser() ).toBe( true );

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            }
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            navigateToIms( jwt );

            imsInstance.initialize();
        } );

        it( 'onAccessToken should return token with pbaSatisfiedPolicy fields', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            let additionalCheck: Function | null = null;

            const profile = {
                name: 'profilename',
                userId: 'user_id',
            };
            const pba = 'HighSec,MedSec,LowSec';
            const pbaPolicies = ['HighSec', 'MedSec', 'LowSec'];
            const jwt = TokenHelper.tokenWithPba( pba );

            const onReady = (): void => {
                const expectedExpireDate = new Date( Date.now() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token: jwt,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: pbaPolicies
                } );

                expect( setHashSpy ).toHaveBeenCalled();

                additionalCheck && additionalCheck();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            additionalCheck = (): void => {
                expect( imsInstance.isSignedInUser() ).toBe( true );

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            }
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            navigateToIms( jwt );

            imsInstance.initialize();
        } );

    } );

    describe( 'fragment exception', () => {
        beforeEach( () => {
            adobeIdDataValues = resetAdobeIdDataValues();
        } );

        it( 'sign out should be called if nonce is invalid', ( done ) => {
            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );
            const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            const profile = {
                name: 'profilename'
            };

            let additionalCheck: Function | null = null;

            const onReady = (): void => {
                expect( setHashSpy ).toHaveBeenCalled();

                const replaceUrlSpyCallValue = uriTestHelper.mostRecent( replaceUrlSpy );
                expect( replaceUrlSpyCallValue.indexOf( 'ims/logout' ) > 0 ).toBeTruthy();

                additionalCheck && additionalCheck();

                done();
            }

            const imsInstance = createAdobeImsInstance( onReady );
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            additionalCheck = (): void => {
                const token = imsInstance.getAccessToken();
                expect( token ).toEqual( null );
            }

            UrlHelper.replaceUrl( `#access_token=${jwt}&client_id=IMSLibJSTestClient&scope=adobeid&reauth=true&api=authorize&nonce=g` );
            replaceUrlSpy.calls.reset();

            imsInstance.initialize();

        } );

        it( 'sign out should not be called if nonce is valid', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );
            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );
            const profile = {
                name: 'profilename'
            };

            const onReady = (): void => {
                expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();

                expect( setHashSpy ).toHaveBeenCalled();

                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );


            navigateToIms( jwt, true );

            imsInstance.initialize();
        } );

    } );

    describe( 'tokenService.getToken returns token', () => {
        beforeEach( function () {
            adobeIdDataValues = resetAdobeIdDataValues();
            jasmine.createSpy( "timerCallback" );
            jasmine.clock().install();
        } );

        afterEach( function () {
            jasmine.clock().uninstall();
        } );


        it( 'get profile returns profile', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            const profile = {
                name: 'profilename',
                userId: 'user_id',
            };
            const startDate = new Date();
            const token = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: []
                } );

                expect( setHashSpy ).toHaveBeenCalled();

            }

            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any,  config: any = {} ) {
                return Promise.reject( {
                    status: 200,
                    data: tokenFieldsData,
                } );
            } );

            navigateToIms( token );

            imsInstance.initialize().then( v => {
                expect( imsInstance.isSignedInUser() ).toBe( true );

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            } )
        } );

        it( 'get profile returns profile from session storage', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            const profile = {
                name: 'profilename',
                userId: 'user_id',
            };
            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token: jwt,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: []
                } );

                expect( setHashSpy ).toHaveBeenCalled();

            }

            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: null,
                } );
            } );

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any,  config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: tokenFieldsData,
                } );
            } );

            navigateToIms( jwt );

            imsInstance.initialize().then( () => {

                imsInstance.getProfile().then( profileValue => {
                    expect( profileValue ).toEqual( profile );
                    done();
                } )
            } )
        } );


        it( 'user is signed in after refresh if previously logged in', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            const errorSpy = spyOn( Log, 'error' );

            onErrorSpy.calls.reset();


            const onReady = (): void => {
                expect( errorSpy ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessTokenHasExpired ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onReauthAccessToken ).not.toHaveBeenCalled();

                expect( setHashSpy ).not.toHaveBeenCalled();
                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( Xhr, 'post' ).and.callFake( function ( data: any, url: string, config: any = {} ) {
                return Promise.reject( {
                    status: 200,
                    data: tokenFieldsData,
                } );
            } );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        name: 'spec'
                    }
                } );
            } );

            UrlHelper.replaceUrl( '#' );

            imsInstance.initialize();

        } );

        it( 'fragment is empty, token is read from local storage, profile read from session', ( done ) => {
            const setHashSpy = spyOn( UrlHelper, 'setHash' );

            onErrorSpy.calls.reset();

            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                expect( adobeIdDataValues.onError ).not.toHaveBeenCalled();
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();

                expect( setHashSpy ).toHaveBeenCalled();
                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: null,
                } );
            } );
            navigateToIms( jwt, false );

            imsInstance.initialize();

        } );

        it( 'fragment is empty, token is read from local storage, profile api is called', ( done ) => {
            const profile = {
                name: 'profilename'
            };
            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();

                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            navigateToIms( jwt, false );

            imsInstance.initialize();
        } );

        it( 'get profile returns empty profile', ( done ) => {

            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token: jwt,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    sid: 'session_identifier',
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: []
                } );

                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );


            const tokenFieldsInfo = {
                ...tokenFieldsData,
            };

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        data: tokenFieldsInfo
                    }
                }  );
            } );

            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        data: tokenFieldsInfo
                    }
                } );
            } );


            navigateToIms( jwt );

            imsInstance.initialize();

        } );

        it( 'get profile returns no message', ( done ) => {
            const profile = null;
            const logSpy = spyOn( Log, 'error' );

            const startDate = new Date();
            const jwt = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                expect( logSpy ).not.toHaveBeenCalled();
                const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith(
                    {
                        token: jwt,
                        expire: jasmine.objectContaining( expectedExpireDate ),
                        sid: 'session_identifier',
                        impersonatorId: '',
                        isImpersonatedSession: false,
                        pbaSatisfiedPolicies: []
                    } );
                expect( adobeIdDataValues.onAccessTokenHasExpired ).not.toHaveBeenCalled();

                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );
            spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: profile,
                } );
            } );

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 404,
                    data: tokenFieldsData,
                } );
            } );

            navigateToIms( jwt );

            imsInstance.initialize();

        } );
    } );



    describe( 'initialize -> Exception', () => {
        beforeEach( () => {
            spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
            adobeIdDataValues = resetAdobeIdDataValues();
        } );

        // afterEach( () => {
        //     mock.reset()
        // } );

        it( 'Token Exception', ( done ) => {
            const logInfoSpy = spyOn( Log, 'info' );


            const profile = {
                name: 'name'
            };
            const token = 'invalid_token';
            let additionalCheck: Function | null = null;

            const onReady = (): void => {
                const allLogCallArguments = logInfoSpy.calls.allArgs();

                expect( allLogCallArguments.length ).toEqual( 2 );

                expect( allLogCallArguments[0][0] ).toEqual( 'initialize exception ended' );
                expect( allLogCallArguments[1][0] ).toEqual( 'onReady initialization' );

                additionalCheck && additionalCheck();

                done();
            }

            const imsInstance = createAdobeImsInstance( onReady );
            imsInstance.signOut();
            spyOn<any>( imsInstance, 'processInitializeException' ).and.callFake( () => Promise.reject( new FragmentException( IFragmentExceptionType.CSRF, 'CSRF exception' ) ) );

            const processTokenResponseSpy = spyOn<any>( imsInstance, 'processTokenResponse' );
            const signOutSpy = spyOn( imsInstance, 'signOut' ).and.callFake( () => 1 );

            additionalCheck = (): void => {
                expect( processTokenResponseSpy ).not.toHaveBeenCalledWith();
                expect( signOutSpy ).toHaveBeenCalled();
            }

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        access_token: token,
                        profile
                    }
                } );
            } );

            imsInstance.initialize();

        } );

        it( 'NoToken Exception', ( done ) => {
            const logInfoSpy = spyOn( Log, 'info' );
            logInfoSpy.calls.reset();

            const profile = {
                name: 'name'
            };
            const startDate = new Date();
            const token = TokenHelper.defaultToken( startDate );

            const onReady = (): void => {
                const allLogCallArguments = logInfoSpy.calls.allArgs();

                // Two extra calls are made for debugging purposes
                expect( allLogCallArguments.length ).toEqual( 4 );
                expect( allLogCallArguments[0] ).toEqual( ['token', token] );
                expect( allLogCallArguments[1] ).toEqual( ['Auto-refresh timer already set, clearing'] );
                expect( allLogCallArguments[2] ).toContain( 'Auto-refresh timer will run after (seconds)' );
                expect( allLogCallArguments[3] ).toEqual( ['onReady initialization'] );

                done();
            }
            const imsInstance = createAdobeImsInstance( onReady );

            spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( () => null );

            UrlHelper.replaceUrl( '#' );

            spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
                return Promise.resolve( {
                    status: 200,
                    data: {
                        access_token: token,
                        profile
                    }
                } );
            } );

            imsInstance.initialize();
        } );

    } );

} );

describe( 'getTokenForPBAPolicy', () => {
    beforeEach( () => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
        adobeIdDataValues = resetAdobeIdDataValues();
    } );

    it( 'access token in storage, pba policy satisfied, TTL ok', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const pbaPoliciesString = 'HighSec,MedSec,LowSec';
        const pbaSatisfiedPolicies = ['HighSec', 'MedSec', 'LowSec'];
        const pbaPolicyName = 'HighSec';
        const token = TokenHelper.tokenWithPba( pbaPoliciesString );

        const accessTokenInfo = {
            token: token,
            expire: new Date( Date.now() + 60 * 1000 ),
            sid: '',
            token_type: 'bearer',
            impersonatorId: '',
            isImpersonatedSession: false,
            pbaSatisfiedPolicies: pbaSatisfiedPolicies
        }

        spyOn( imsInstance, 'getAccessToken' ).and.callFake( function (): ITokenInformation {
            return accessTokenInfo;
        } )

        imsInstance.getTokenForPBAPolicy( pbaPolicyName )
            .then( ( tokenInfo ) => {
                expect( adobeIdDataValues.onAccessToken ).not.toHaveBeenCalled( );
                expect( tokenInfo ).toEqual( accessTokenInfo );

                done();
            } );
    } );

    it( 'access token in storage, pba policy satisfied, TTL not ok', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const pbaPoliciesString = 'HighSec,MedSec,LowSec';
        const pbaSatisfiedPolicies = ['HighSec', 'MedSec', 'LowSec'];
        const pbaPolicyName = 'HighSec';
        const token = TokenHelper.tokenWithPba( pbaPoliciesString );

        const refreshTokenSpy = spyOn( imsInstance, 'refreshToken' ).and.callThrough();

        const tokenInStorage = {
            token: TokenHelper.defaultToken( new Date( Date.now() - 1000 ) ),
            expire: new Date( Date.now() + 6 * 1000 ),
            sid: '',
            token_type: 'bearer',
            impersonatorId: '',
            isImpersonatedSession: false,
            pbaSatisfiedPolicies: pbaSatisfiedPolicies
        }

        spyOn( imsInstance, 'getAccessToken' ).and.callFake( function (): ITokenInformation {
            return tokenInStorage;
        } ).and.callThrough()

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearer',
                },
            } );
        } );

        imsInstance.getTokenForPBAPolicy( pbaPolicyName )
            .then( () => {
                const expectedExpireDate = new Date( Date.now() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    token_type: 'bearer',
                    sid: undefined,
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: pbaSatisfiedPolicies
                } );

                const existingAccessToken = imsInstance.getAccessToken();
                expect( existingAccessToken && existingAccessToken.token ).toEqual( token );
                expect( refreshTokenSpy ).toHaveBeenCalledWith( objectContaining( {
                    pba_policy: pbaPolicyName
                } ) )

                done();
            } );
    } );

    it( 'access token in storage, pba policy not satisfied, TTL ok', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const pbaPoliciesString = 'HighSec,MedSec,LowSec';
        const pbaSatisfiedPolicies = ['HighSec', 'MedSec', 'LowSec'];
        const pbaPolicyName = 'HighSec';
        const token = TokenHelper.tokenWithPba( pbaPoliciesString );

        const refreshTokenSpy = spyOn( imsInstance, 'refreshToken' ).and.callThrough();

        const tokenInStorage = {
            token: TokenHelper.defaultToken( new Date( Date.now() - 1000 ) ),
            expire: new Date( Date.now() + 100 * 1000 ),
            sid: '',
            token_type: 'bearer',
            impersonatorId: '',
            isImpersonatedSession: false,
            pbaSatisfiedPolicies: ['MedSec', 'LowSec']
        }

        spyOn( imsInstance, 'getAccessToken' ).and.callFake( function (): ITokenInformation {
            return tokenInStorage;
        } ).and.callThrough()

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearer',
                },
            } );
        } );

        imsInstance.getTokenForPBAPolicy( pbaPolicyName )
            .then( () => {
                const expectedExpireDate = new Date( Date.now() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    token_type: 'bearer',
                    sid: undefined,
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: pbaSatisfiedPolicies
                } );

                const existingAccessToken = imsInstance.getAccessToken();
                expect( existingAccessToken && existingAccessToken.token ).toEqual( token );
                expect( refreshTokenSpy ).toHaveBeenCalledWith( objectContaining( {
                    pba_policy: pbaPolicyName
                } ) )

                done();
            } );
    } );

    it( 'no access token in storage, /check/token successful', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const pbaPoliciesString = 'HighSec,MedSec,LowSec';
        const pbaSatisfiedPolicies = ['HighSec', 'MedSec', 'LowSec'];
        const pbaPolicyName = 'HighSec';
        const token = TokenHelper.tokenWithPba( pbaPoliciesString );

        const refreshTokenSpy = spyOn( imsInstance, 'refreshToken' ).and.callThrough();

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearer',
                },
            } );
        } );

        imsInstance.getTokenForPBAPolicy( pbaPolicyName )
            .then( () => {
                const expectedExpireDate = new Date( Date.now() + parseFloat( expires_in ) );
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                    token,
                    expire: jasmine.objectContaining( expectedExpireDate ),
                    token_type: 'bearer',
                    sid: undefined,
                    impersonatorId: '',
                    isImpersonatedSession: false,
                    pbaSatisfiedPolicies: pbaSatisfiedPolicies
                } );

                const existingAccessToken = imsInstance.getAccessToken();
                expect( existingAccessToken && existingAccessToken.token ).toEqual( token );
                expect( refreshTokenSpy ).toHaveBeenCalledWith( objectContaining( {
                    pba_policy: pbaPolicyName
                } ) )

                done();
            } );
    } );

    it( 'no access token in storage, ride error on /check/token', ( done ) => {
        adobeIdDataValues.redirect_uri = 'test_redirect_uri';
        const imsInstance = createAdobeImsInstance( () => 0 );
        const pbaPolicyName = 'HighSec';

        const contextToBePassedOnRedirect = 'contextData';

        const refreshTokenSpy = spyOn( imsInstance, 'refreshToken' ).and.callThrough();
        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrlAndWait' );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 400,
                data: {
                    error: 'ride_AdobeID_acct_actreq',
                    jump: 'jump' },
            } );
        } );

        imsInstance.getTokenForPBAPolicy( pbaPolicyName, 10000, contextToBePassedOnRedirect )
            .catch(  ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', 'jump' ) );
                expect( adobeIdDataValues.onAccessToken ).not.toHaveBeenCalled() ;

                expect( refreshTokenSpy ).toHaveBeenCalledWith( objectContaining( {
                    pba_policy: pbaPolicyName,
                    state: objectContaining( { context: contextToBePassedOnRedirect } ),
                    redirect_uri: adobeIdDataValues.redirect_uri + '#old_hash=&from_ims=true?client_id=' + adobeIdDataValues.client_id + '&api=check_token&scope=' + adobeIdDataValues.scope
                } ) )

                expect( replaceUrlSpy ).toHaveBeenCalledWith( 'jump', 10000 );

                replaceUrlSpy.calls.reset();

                done();
            } );
    } );
} );


describe( 'refresh token', () => {
    beforeEach( () => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
        adobeIdDataValues = resetAdobeIdDataValues();
    } );

    // afterEach( () => {
    //     mock.reset()
    // } );

    it( 'refresh token throws http error', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex instanceof TokenExpiredException ).toBeTrue();
                expect( adobeIdDataValues.onAccessTokenHasExpired ).toHaveBeenCalled();

                done();
            } );
    } );

    it( 'refresh token throws HttpErrorResponse', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( new HttpErrorResponse( {
                error: 'rate_limited',
                retryAfter: 10,
            } ) );
        } );

        imsInstance.refreshToken()
            .catch( () => {
                expect( adobeIdDataValues.onAccessTokenHasExpired ).not.toHaveBeenCalled();

                done();
            } );
    } );

    it( 'refresh token throws error: no check token response', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: null
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex instanceof TokenExpiredException ).toBeTrue();
                expect( ex.exception.message ).toEqual( 'refresh token --> no response' );
                expect( adobeIdDataValues.onAccessTokenHasExpired ).toHaveBeenCalled();

                done();
            } );


    } );

    it( 'refresh token throws error: checkToken returns data with error in it', ( done ) => {

        const tokenApiResponse = {
            error: 'weird error',
        };
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 409,
                data: tokenApiResponse,
            } );
        } );

        const logErrorSpy = spyOn( Log, 'error' );

        imsInstance.refreshToken()
            .catch( ex => {
                const spyArgs = logErrorSpy.calls.argsFor( 0 );

                expect( ex.exception ).toEqual( tokenApiResponse );
                expect( spyArgs[0] ).toEqual( 'refresh token error' );
                expect( adobeIdDataValues.onAccessTokenHasExpired ).toHaveBeenCalled();

                done();
            } );


    } );

    it( 'refresh token returns invalid token, get profile throws exception', ( done ) => {

        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: 'cannotdecodetoken',
                }
            } );
        } );

        // mock.onGet( ROUTES.PROFILE_API ).reply( 200, {} );
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {}
            } );
        } );


        imsInstance.refreshToken().catch( ex => {
            expect( ex.exception.message ).toEqual( 'token cannot be decoded cannotdecodetoken' );

            done();
        } );


    } );

    it( 'refresh token returns token and no profile. profile api returns no profile', ( done ) => {

        const startDate = new Date();
        const token = TokenHelper.defaultToken( startDate );
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearear',
                },
            } );
        } );

        // mock.onGet( ROUTES.PROFILE_API ).reply( 200, null );
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: null,
            } );
        } );

        imsInstance.refreshToken()
            .then( () => {
                expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalled();
                done();
            } )

    } );

    it( 'refresh token returns token and profile', ( done ) => {

        const profile = {
            name: 'name'
        };
        const startDate = new Date();
        const token = TokenHelper.defaultToken( startDate );
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearear',
                    ...profile
                }
            } );
        } );

        imsInstance.refreshToken().then( () => {
            const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                token,
                expire: jasmine.objectContaining( expectedExpireDate ),
                token_type: 'bearear',
                sid: undefined,
                impersonatorId: '',
                isImpersonatedSession: false,
                pbaSatisfiedPolicies: []
            } );

            const existingAccessToken = imsInstance.getAccessToken();
            expect( existingAccessToken && existingAccessToken.token ).toEqual( token );

            done();
        } );

    } );

    it( 'refresh token returns token with impersonatorId and isImpersonatedSession fields', ( done ) => {

        const profile = {
            name: 'name'
        };
        const startDate = new Date();
        const token = TokenHelper.impersonatedToken( startDate );
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearear',
                    ...profile
                }
            } );
        } );

        imsInstance.refreshToken().then( () => {
            const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                token,
                expire: jasmine.objectContaining( expectedExpireDate ),
                token_type: 'bearear',
                sid: undefined,
                impersonatorId: 'impersonator_id',
                isImpersonatedSession: true,
                pbaSatisfiedPolicies: []
            } );

            const existingAccessToken = imsInstance.getAccessToken();
            expect( existingAccessToken && existingAccessToken.token ).toEqual( token );

            done();
        } );

    } );

    it( 'refresh token throws RideException with jump', ( done ) => {

        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrlAndWait' ).and.resolveTo();
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 409,
                data: {
                    error: 'ride_AdobeID_acct_actreq',
                    jump: 'testurl'
                }
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', 'testurl' ) );
                expect( replaceUrlSpy ).toHaveBeenCalledWith( 'testurl', 10000 );
                replaceUrlSpy.calls.reset();

                done();
            } );


    } );

    it( 'refresh token throws RideException with jump, but is overriden', ( done ) => {
        let overrideCalled = false;
        const overrideErrorHandler = (): boolean => {
            overrideCalled = true;
            return false;
        };
        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrl' );
        const imsInstance = createAdobeImsWithData( { overrideErrorHandler } );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 409,
                data: {
                    error: 'ride_AdobeID_acct_actreq',
                    jump: 'testurl'
                }
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', 'testurl' ) );
                expect( replaceUrlSpy ).not.toHaveBeenCalled();
                replaceUrlSpy.calls.reset();
                expect( overrideCalled ).toBeTrue();
                done();
            } );
    } );

    it( 'refresh token throws RideException with jump, is overriden, but continues flow', ( done ) => {
        let overrideCalled = false;
        const overrideErrorHandler = (): boolean => {
            overrideCalled = true;
            return true;
        };
        const replaceUrlSpy = spyOn( UrlHelper, 'replaceUrlAndWait' );
        const imsInstance = createAdobeImsWithData( { overrideErrorHandler } );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 409,
                data: {
                    error: 'ride_AdobeID_acct_actreq',
                    jump: 'testurl'
                }
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', 'testurl' ) );
                expect( replaceUrlSpy ).toHaveBeenCalledWith( 'testurl', 10000 );
                replaceUrlSpy.calls.reset();
                expect( overrideCalled ).toBeTrue();
                done();
            } );
    } );

    it( 'refresh token throws RideException without jump', ( done ) => {

        const imsInstance = createAdobeImsInstance( () => 0 );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 409,
                data: {
                    error: 'ride_AdobeID_acct_actreq',
                }
            } );
        } );

        imsInstance.refreshToken()
            .catch( ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', '' ) );

                done();
            } );

    } );
} );

describe( 'validate token', () => {
    beforeEach( () => {
        adobeIdDataValues = resetAdobeIdDataValues();
    } );

    it( 'validateToken throws exception; validate token api throws networkError exception', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const logSpy = spyOn( Log, 'warn' );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 0,
                data: null,
            } );
        } );

        imsInstance.validateToken()
            .catch( () => {
                expect( logSpy ).toHaveBeenCalledWith( 'validate token exception',
                    new HttpErrorResponse( { code: 0, error: 'networkError', retryAfter: undefined, message: '' } ) );

                done();
            } );
    } );

    it( 'validateToken throws exception; validate token api throws exception', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 404,
                data: null,
            } );
        } );

        imsInstance.validateToken()
            .catch( ( ex ) => {
                expect( ex ).toEqual( false );

                done();
            } );
    } );

    it( 'validateToken throws exception; validate token returns invalid data', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );
        const logSpy = spyOn( Log, 'warn' );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {},
            } );
        } );

        imsInstance.validateToken()
            .catch( () => {
                expect( logSpy ).toHaveBeenCalledWith( 'validate token exception', null );

                done();
            } );
    } );


} )

describe( 'constructor', () => {

    beforeAll( function () {
        Main.initialize();
    } );

    const imsWndKey = 'ims1';

    it( 'throws error in case the AdobeIdData is empty', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;

        expect( () => new AdobeIMS() ).toThrowError( 'Please provide required adobeId, client_id information' );

        window[AdobeIdKey] = adobeIdData;
    } );

    it( 'throws error in case the clientId is empty', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = {
            scope : "testScope"
        };

        expect( () => new AdobeIMS() ).toThrowError( 'Please provide required adobeId, client_id information' );

        window[AdobeIdKey] = adobeIdData;
    } );

    it( 'it create a AdobeIMs instance in case the AdobeIdData is passed', () => {
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;

        expect( () => new AdobeIMS( adobeIdData ) ).not.toBeNull();

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


describe( 'dom events ', () => {

    it( 'ims created before analytics library', ( done ) => {

        let additionalCheck: Function | null = null;

        let domEventValue;
        window.addEventListener( ON_IMSLIB_INSTANCE, ( value ) => {
            domEventValue = value;
        }, false );

        const onReady = (): void => {
            additionalCheck && additionalCheck();
        }

        const imsInstance = createAdobeImsInstance( onReady );

        const analyticsLibrary: AnalyticsLibrary = new AnalyticsLibrary();

        additionalCheck = (): void => {
            expect( analyticsLibrary.imsInstances.length ).toBeGreaterThan( 0 );
            done();
        }

        imsInstance.initialize();
    } );

    it( 'ims lib is created after analytics library', ( done ) => {

        let additionalCheck: Function | null = null;

        const analyticsLibrary: AnalyticsLibrary = new AnalyticsLibrary();
        analyticsLibrary.clear();

        expect( analyticsLibrary.imsInstances.length ).toEqual( 0 );

        const onReady = (): void => {
            setTimeout( () => {
                additionalCheck && additionalCheck();
            }, 100 );
        }

        additionalCheck = (): void => {
            expect( analyticsLibrary.imsInstances.length ).toEqual( 1 );
            done();
        }

        const imsInstance = createAdobeImsInstance( onReady );
        imsInstance.initialize();
    } );

    it( 'switch profile returns token and profile', ( done ) => {

        const profile = {
            name: 'name'
        };
        const startDate = new Date();
        const token = TokenHelper.defaultToken( startDate );
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearear',
                    ...profile
                }
            } );
        } );

        imsInstance.switchProfile( 'myUserid' ).then( () => {
            const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                token,
                expire: jasmine.objectContaining( expectedExpireDate ),
                token_type: 'bearear',
                sid: undefined,
                impersonatorId: '',
                isImpersonatedSession: false
            } );

            const existingAccessToken = imsInstance.getAccessToken();
            expect( existingAccessToken && existingAccessToken.token ).toEqual( token );

            done();
        } );

    } );

    it( 'switch profile returns token with impersonatorId and isImpersonatedSession fields', ( done ) => {

        const profile = {
            name: 'name'
        };
        const startDate = new Date();
        const token = TokenHelper.impersonatedToken( startDate );
        const imsInstance = createAdobeImsInstance( () => 0 );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {
                    access_token: token,
                    expires_in,
                    token_type: 'bearear',
                    ...profile
                }
            } );
        } );

        imsInstance.switchProfile( 'myUserid' ).then( () => {
            const expectedExpireDate = new Date( startDate.getTime() + parseFloat( expires_in ) );
            expect( adobeIdDataValues.onAccessToken ).toHaveBeenCalledWith( {
                token,
                expire: jasmine.objectContaining( expectedExpireDate ),
                token_type: 'bearear',
                sid: undefined,
                impersonatorId: 'impersonator_id',
                isImpersonatedSession: true
            } );

            const existingAccessToken = imsInstance.getAccessToken();
            expect( existingAccessToken && existingAccessToken.token ).toEqual( token );

            done();
        } );

    } );

} );

describe( 'jumpToken', () => {
    beforeEach( () => {
        adobeIdDataValues = resetAdobeIdDataValues();
    } );

    it( 'jumpToken returns jump value', ( done ) => {
        const imsInstance = createAdobeImsInstance( () => 0 );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { jump: 'jumpurl' },
            } );
        } );

        const expected = {
            jump: 'jumpurl'
        };

        imsInstance.jumpToken( {
            bearer_token: '',
            target_client_id: '',
            target_scope: '',
        } )
            .then( ( value ) => {
                expect( value ).toEqual( expected )

                done();
            } );
    } );

} )
