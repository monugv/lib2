import { AdobeIMS } from "../../src/adobe-ims/AdobeIMS";
import { AdobeIdKey } from "../../src/constants/ImsConstants";
import UrlHelper from "../../src/url/UrlHelper";
import { IReauth } from "../../src/adobe-ims/facade/IReauth";
import { redirectUriMatching } from "../matchers/adobe.matcher";
import { CsrfService, ONE_HOUR } from "../../src/adobe-ims/csrf/CsrfService";
import Debouncer from "../../src/debounce/Debouncer";
import { ProfileException } from "../../src/profile/ProfileException";
import Log from "../../src/log/Log";
import { IEnvironment } from "../../src/adobe-id/IEnvironment";
import { IAdobeIdData } from "../../src/adobe-id/IAdobeIdData";
import FragmentHelper from "../../src/url/FragmentHelper";
import TokenHelper from "./../helpers/token-helper";
import Environment from "../../src/adobe-ims/environment/Environment";
import Xhr from "../../src/ims-apis/xhr/Xhr";
import StorageFactory from "../../src/storage/StorageFactory";
import { TokenFields } from "../../src/token/TokenFields";
import { ImsApis } from "../../src/ims-apis/ImsApis";
import { ModalSignInEvent } from "../../src/token/ModalSignInEvent";

const fakeCheckToken = ( ims: AdobeIMS ): void => {
    spyOn( ims.imsApis, "checkToken" ).and.callFake( () => Promise.resolve( {} ) )
}

describe( "signIn method", () => {
    it( "verifies the version", () => {
        const adobeIMS = new AdobeIMS();
        expect( adobeIMS.version.startsWith( "v2-" ) ).toBeTruthy();
        expect( adobeIMS.signIn ).toBeDefined();
    } );

    it( "throws error in case the AdobeIdData is empty", () => {
    // save the adobeId information and set it as null in order to simulate scenario when there is not adobeId value
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = null;
        expect( () => new AdobeIMS() ).toThrowError(
            "Please provide required adobeId, client_id information"
        );

        // set back the adobeId value
        window[AdobeIdKey] = adobeIdData;
    } );

    it( "throws error in case the clientId is empty", () => {
        // save the adobeId information and set it as null in order to simulate scenario when there is not adobeId value
        const adobeIdData = window[AdobeIdKey];
        window[AdobeIdKey] = {
            scope : "testScope"
        };
        expect( () => new AdobeIMS() ).toThrowError(
            "Please provide required adobeId, client_id information"
        );

        // set back the adobeId value
        window[AdobeIdKey] = adobeIdData;
    } );

    it( "adobeid", () => {
        expect( () => new AdobeIMS().adobeid ).toBeDefined();
    } );
} );

describe( "initialize", () => {
    it( "calls getToken on initialize", () => {
        const adobeIMS = new AdobeIMS();

        const getTokenSpy = spyOn( adobeIMS, "initialize" );
        
        fakeCheckToken( adobeIMS );

        adobeIMS.initialize();

        const adobeid = adobeIMS.adobeid;

        expect( adobeid.client_id ).toEqual( window[AdobeIdKey].client_id );
        expect( getTokenSpy ).toHaveBeenCalled();
    } );

    it ( "doesn't call onError for invalid_credentials result on check/token", async () => {
        let onErrorCalled = false;
        const adobeIMS = new AdobeIMS();
        ( adobeIMS as any ).adobeIdData.onError = (): void => { onErrorCalled = true }
        spyOn( adobeIMS.imsApis, "checkToken" ).and.callFake( () => Promise.reject( { message: 'invalid_credentials' } ) )
        await adobeIMS.initialize();
        expect( onErrorCalled ).toBeFalse();
    } )
} );

describe( "re authentification -- no profile", () => {
    it( "execute the re authentification; default value is check", ( done ) => {

        const adobeIMS = new AdobeIMS();
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize().then( async () => {

            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce1',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            await adobeIMS.reAuthenticate( {}, IReauth.check );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                reauth: 'check',
                client_id: 'IMSLibJSTestClient',
                scope: 'AdobeID,openid',
                state: JSON.stringify( { ac: 'appcode', av: 'appversion', jslibver: Environment.jslibver, nonce: 'nonce1' } ),
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                redirectParams:
                {
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'AdobeID,openid',
                    reauth: 'check',
                    old_hash: '',
                    from_ims: 'true',
                }
            } ) );

            replaceUrlSpy.calls.reset();

            done();

        } )

    } );

    it( 'execute the  re authentification with reauth equal force', ( done ) => {
        
        const adobeIMS = new AdobeIMS();
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize().then( async () => {

            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce1',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );
        
            await adobeIMS.reAuthenticate( {}, IReauth.force );

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                reauth: 'force',
                client_id: 'IMSLibJSTestClient',
                scope: 'AdobeID,openid',
                state: JSON.stringify( { ac: 'appcode', av: 'appversion', jslibver: Environment.jslibver, nonce: 'nonce1', } ),
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                redirectParams:
            {
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'AdobeID,openid',
                reauth: 'force',
                old_hash: '',
                from_ims: 'true',
            }
            } ) )
            replaceUrlSpy.calls.reset();

            done();
        } )
        

    } );

    it( 'execute the  re authentification with reauth equal force and external parameters', ( done ) => {
        
        const adobeIMS = new AdobeIMS();
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize().then( async () => {
            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce1',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            await adobeIMS.reAuthenticate( {
                api: 'customapiname'
            }, IReauth.force );
    
            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching( {
                api: 'customapiname',
                reauth: 'force',
                client_id: 'IMSLibJSTestClient',
                scope: 'AdobeID,openid',
                state: JSON.stringify( { ac: 'appcode', av: 'appversion', jslibver: Environment.jslibver, nonce: 'nonce1' } ),
                locale: 'ro',
                response_type: 'token',
                jslVersion: Environment.jslibver,
                redirectParams:{                
                    client_id: 'IMSLibJSTestClient',
                    api: 'authorize',
                    scope: 'AdobeID,openid',
                    reauth: 'force',
                    old_hash: '',
                    from_ims: 'true',                    
                }
            } ) )
            replaceUrlSpy.calls.reset();
            done();
        } );
        
    } );
       
} );

describe( 'signUp', () => {

    it( 'execute the re signup method', ( done ) => {

        const adobeIMS = new AdobeIMS();
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize().then( async () => {

            const replaceUrlSpy = spyOn( UrlHelper, 'setHrefUrl' );
            spyOn( CsrfService, 'generateNonce' ).and.callFake( function () {
                return {
                    value: 'nonce1',
                    expiry: ( new Date().getTime() - ONE_HOUR - 1 ).toString()
                }
            } );

            await adobeIMS.signUp();

            expect( replaceUrlSpy ).toHaveBeenCalledWith( redirectUriMatching(
                {
                    idp_flow: "create_account",
                    client_id: "IMSLibJSTestClient",
                    scope: "AdobeID,openid",
                    state: JSON.stringify( { ac: 'appcode', av: 'appversion', jslibver: Environment.jslibver, nonce: "nonce1" } ),
                    locale: "ro",
                    response_type: "token",
                    jslVersion: Environment.jslibver,
                    redirectParams: {
                        client_id: "IMSLibJSTestClient",
                        api: "authorize",
                        scope: "AdobeID,openid",
                        old_hash: '',
                        from_ims: 'true',
                    }
                } ) );
            replaceUrlSpy.calls.reset();
            done();

        } )
        
    } );

} );

describe( "getReauthAccesToken ", () => {
    it( "getReauthAccesToken returns no token", () => {
        const adobeIMS = new AdobeIMS();
        const reauthToken = adobeIMS.getReauthAccessToken();

        expect( reauthToken ).toEqual( null );
    } );
} );

describe( "isSignedInUser", () => {
    it( "isSignedInUser returns false", () => {
        const adobeIMS = new AdobeIMS();
        const response = adobeIMS.isSignedInUser();

        expect( response ).toEqual( false );
    } );

    it( "isSignedInUser returns true when access token is present", () => {
        const adobeIMS = new AdobeIMS();
        spyOn( adobeIMS, "getAccessToken" ).and.callFake( () => ( {
            token: "sometoken",
            expire: new Date(),
            sid: "session_identifier",
        } ) );

        const response = adobeIMS.isSignedInUser();
        expect( response ).toEqual( true );
    } );

    it( "isSignedInUser returns true when reauth token is present", () => {
        const adobeIMS = new AdobeIMS();
        spyOn( adobeIMS, "getReauthAccessToken" ).and.callFake( () => ( {
            token: "sometoken",
            expire: new Date(),
            sid: "session_identifier",
        } ) );

        const response = adobeIMS.isSignedInUser();
        expect( response ).toEqual( true );
    } );
} );

describe( "getProfile ", () => {
    it( "getProfile throws exception when neither auth token nor reauth token are present", ( done ) => {
        const adobeIMS = new AdobeIMS();
        adobeIMS.getProfile().catch( ( ex ) => {
            expect( ex ).toEqual(
                new ProfileException( "please login before getting the profile" )
            );
            done();
        } );
    } );
} );

describe( "getProfile throws 401 (unauthorized) exception ", () => {
    const adobeIMSInstance = new AdobeIMS();

    it( "getProfile  service throws 401", ( done ) => {
        const refreshError = {
            error: "from refresh",
        };

        spyOn( Xhr, "get" ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 401,
                data: {},
            } );
        } );

        spyOn( adobeIMSInstance, "getAccessToken" ).and.callFake( function () {
            return { token: "token_value", expire: new Date(), sid: "session" };
        } );
        const refreshTokenSpy = spyOn(
            adobeIMSInstance,
            "refreshToken"
        ).and.callFake( function () {
            return Promise.reject( refreshError );
        } );
        adobeIMSInstance.getProfile().catch( ( ex ) => {
            expect( refreshTokenSpy ).toHaveBeenCalled();
            expect( ex ).toEqual( refreshError );
            done();
        } );
    } );
} );

describe( "avatarUrl ", () => {
    it( "avatarUrl  returns value", () => {
        const adobeIMS = new AdobeIMS();
        const response = adobeIMS.avatarUrl( "userid" );

        expect( response ).toEqual(
            "https://ims-na1-stg1.adobelogin.com/ims/avatar/download/userid"
        );
    } );
} );

describe( "social providers ", () => {
    it( "throws exception", ( done ) => {
        const adobeIMS = new AdobeIMS();
        spyOn( Debouncer, "getCachedApiResponse" ).and.callFake( () => {
            throw new Error( "cached exception" );
        } );
        adobeIMS.listSocialProviders().catch( ( ex ) => {
            expect( ex.message ).toEqual( "cached exception" );
            done();
        } );
    } );

    it( "signInWithSocialProvider -- no provider", ( done ) => {
        const adobeIMS = new AdobeIMS();
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize().then( () => {
            try {
                adobeIMS.signInWithSocialProvider( '' );
            }
            catch( ex ) {
                expect( ex.message ).toEqual( 'please provide the provider name' );
                done();
            }
        } )
        
    } );
} );

describe( "enable disable logging", () => {
    it( "enable logging", () => {
        const enableLoggingSpy = spyOn( Log, "enableLogging" );

        const adobeIMS = new AdobeIMS();
        adobeIMS.enableLogging();

        expect( enableLoggingSpy ).toHaveBeenCalled();
    } );

    it( "disable logging", () => {
        const disableLoggingSpy = spyOn( Log, "disableLogging" );

        const adobeIMS = new AdobeIMS();
        adobeIMS.disableLogging();

        expect( disableLoggingSpy ).toHaveBeenCalled();
    } );
} );

describe( "multiple clients", function () {
    it( "only one clients is processing ", function ( done ) {
        let tokenClient1, tokenClient2;
        let onError1, onError2;

        const startDate = new Date();
        const client2 = "IMSLibJSTestClient2";
        const access_token = TokenHelper.tokenForClient2( startDate, client2 );
        const nonce = new CsrfService( client2 ).initialize();

        const adobeId2: IAdobeIdData = {
            client_id: client2,
            locale: "ro",
            scope: "adobeid",
            api_parameters: { test: 1 },
            onAccessToken: ( value ) => {
                tokenClient2 = value;
            },
            onAccessTokenHasExpired: null,
            onReauthAccessToken: null,
            onReady: () => {
                expect( tokenClient2 ).toBeDefined();
                expect( tokenClient1 ).toBeUndefined();

                done();
            },
            onError: ( type, err ) => {
                onError2 = {
                    type,
                    err,
                };
            },
            environment: IEnvironment.STAGE,
        };
        const adobeIMS2 = new AdobeIMS( adobeId2 );

        const adobeId1: IAdobeIdData = {
            client_id: "IMSLibJSTestClient1",
            locale: "ro",
            scope: "adobeid",
            api_parameters: { test: 1 },
            onAccessToken: ( value ) => {
                tokenClient1 = value;
            },
            onAccessTokenHasExpired: null,
            onReauthAccessToken: null,
            onReady: () => {
                expect( tokenClient1 ).not.toBeDefined();

                adobeIMS2
                    .initialize()
                    .then( () => null )
                    .catch( () => null );
            },
            onError: ( type, err ) => {
                onError1 = {
                    type,
                    err,
                };
            },
            environment: IEnvironment.STAGE,
        };

        const adobeIMS1 = new AdobeIMS( adobeId1 );

        spyOn( FragmentHelper, "fragmentToObject" ).and.callFake( function () {
            return {
                client_id: client2,
                scope: "adobeid999",
                access_token,
                expires_in: "500000",
                state: { nonce },
                api: "authorize",
                from_ims: true,
            };
        } );

        fakeCheckToken( adobeIMS1 );

        adobeIMS1
            .initialize()
            .then( () => null )
            .catch( () => null );
    } );
} );


describe( "getTransitoryAuthorizationCode ", () => {
    it( "getTransitoryAuthorizationCode  call ims api", () => {
        const postSpy = spyOn( Xhr, "post" ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: {},
            } );
        } );

        const adobeIMS = new AdobeIMS();
        const headers = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8', 'client_id' : 'IMSLibJSTestClient' };

        adobeIMS.getTransitoryAuthorizationCode( {
            target_client_id: '',
            target_scope: '',
            response_type: '',
        } ).then( ()=>{
            expect( postSpy ).toHaveBeenCalledWith( 
                `https://adobeid-na1-stg1.services.adobe.com/ims/check/v6/token?client_id=IMSLibJSTestClient&jslVersion=${Environment.jslibver}`, 
                'target_client_id=IMSLibJSTestClient&target_scope=AdobeID%2Copenid&response_type=code',
                headers );
        } )

        
    } );
} );

describe( "jumpToken ", () => {
    it( "jumpToken  call ims api", () => {
        const postSpy = spyOn( Xhr, "post" ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { jump: 'jumpurl' },
            } );
        } );

        const adobeIMS = new AdobeIMS();
        const headers = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8', 'client_id' : 'IMSLibJSTestClient' };

        adobeIMS.jumpToken( {
            bearer_token: '',
            target_client_id: '',
            target_scope: '',
        } ).then( ()=>{
            expect( postSpy ).toHaveBeenCalledWith( 
                `https://adobeid-na1-stg1.services.adobe.com/ims/jumptoken/v1?client_id=IMSLibJSTestClient&jslVersion=${Environment.jslibver}`, 
                'bearer_token=&target_client_id=IMSLibJSTestClient&target_scope=AdobeID%2Copenid', headers );
        } )

        
    } );
} );

describe( "exchange ijt ", () => {
    it( "exchange ijt  call ims api", ( done ) => {

        const startDate = new Date();
        const access_token = TokenHelper.defaultToken( startDate );
        const profile = { email: "some@email.com" };
        const getSpy = spyOn( Xhr, "get" ).and.callFake( function (  url: string, data: any, config: any = {}  ) {
            return Promise.resolve( {
                status: 200,
                data: { 
                    profile,
                    access_token, 
                    expires_in: 5000 
                },
            } );
        } );
        const adobeIdData = {
            ...window[AdobeIdKey],
            ijt: 'ijt_value',
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onAccessToken: ( result ) => {}
        }

        const onAccessTokenSpy = spyOn(
            adobeIdData,
            "onAccessToken"
        )

        const adobeIMS = new AdobeIMS( adobeIdData );
        const profileServiceSetProfileSpy = spyOn( ( adobeIMS as any ).profileService, 'saveProfileToStorage' );
    
        fakeCheckToken( adobeIMS );
        adobeIMS.initialize( ).then( ()=>{
            expect( getSpy ).toHaveBeenCalledWith( `https://adobeid-na1-stg1.services.adobe.com/ims/jump/implicit/ijt_value?client_id=IMSLibJSTestClient&jslVersion=${Environment.jslibver}`, { 'client_id' : 'IMSLibJSTestClient' } )
            expect( onAccessTokenSpy ).toHaveBeenCalled();
            expect( profileServiceSetProfileSpy ).toHaveBeenCalledWith( profile );
            done();
        } )
        
    } );
} );

describe( "retrieve verifier for nonce ", () => {
    it( 'retrieves existing verifier from storage', () => {
        StorageFactory.getAvailableStorage().setItem(
            'verifiers',
            JSON.stringify( { 'nonce1': { verifier:'vf-nonce1' } } )
        )
        const adobeIdData = {
            ...window[AdobeIdKey],
            onAccessToken: ( result ) =>  null
        }
        const adobeIMS = new AdobeIMS( adobeIdData );
        expect( adobeIMS.getVerifierByKey( 'nonce1' ) ).toBe( 'vf-nonce1' );
    } )

    it( 'returns empty if not present', () => {
    
        const adobeIdData = {
            ...window[AdobeIdKey],
            onAccessToken: ( result ) => null
        }
        const adobeIMS = new AdobeIMS( adobeIdData );
        expect( adobeIMS.getVerifierByKey( 'noncex' ) ).toBe( '' );
    } )
} );

describe( "getReleaseFlags ", () => {
    it( "get Release Flags, no decoding", ( done ) => {
        const adobeIMS = new AdobeIMS();
        spyOn( adobeIMS.imsApis, "getReleaseFlags" ).and.callFake( () => Promise.resolve( 'abc' ) );
        spyOn( ( adobeIMS as any ).tokenService, 'getTokenFieldsFromStorage' ).and.callFake( () => ( { token: 'test' } ) )
        adobeIMS.getReleaseFlags().then( ( releaseFlags )=> {
            expect( releaseFlags ).toEqual( 'abc' );
            done();
        } ).catch( err => {
            console.error( err );
            fail( err );
            done();
        } );
    } );
    it( "get Release Flags, no decoding", ( done ) => {
        const adobeIMS = new AdobeIMS();
        spyOn( adobeIMS.imsApis, "getReleaseFlags" ).and.callFake( () => Promise.resolve( { releaseFlags: 'IJQXGZJTGIQFIZLTOQ======' } ) );
        spyOn( ( adobeIMS as any ).tokenService, 'getTokenFieldsFromStorage' ).and.callFake( () => ( { token: 'test' } ) )
        adobeIMS.getReleaseFlags( true ).then( ( releaseFlags )=> {
            expect( releaseFlags ).toEqual( '0100001010000110110011101010011011001100010011000000010000101010101001101100111000101110' );
            done();
        } ).catch( err => {
            console.error( err );
            fail( err );
            done();
        } );
    } );
} );

describe( "handle modal popup message", () => {

    const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiY2xpZW50X2lkIjoiSU1TTGliSlNUZXN0Q2xpZW50Iiwic2NvcGUiOiJ0ZXN0U2NvcGUifQ.NZqt4Yup2sTb7AjjgmXDoVit5tYiqVr4TG0fASaXbLQ";
    const testClient = window[AdobeIdKey].client_id;
    
    let nonce: string;
    let url: string; 

    beforeEach( ()=>{
        nonce = new CsrfService( testClient ).initialize();
        url = `https://test.com/?#old_hash=&from_ims=true&client_id=${testClient}&api=authorize&scope=testScope#access_token=${accessToken}&state=%7B%22nonce%22%3A%22${nonce}%22%7D&token_type=bearer&expires_in=86399997`;
    } )
    
    it( "calls modal handler if present on the adobeIdData", async ( ) => {
        const urlSpy = spyOn( UrlHelper, "replaceUrl" );

        let calledHandler = false;
        const adobeIdData = {
            ...window[AdobeIdKey],
            onModalModeSignInComplete: ( token: TokenFields ): boolean => {
                expect( token.client_id ).toEqual( adobeIdData.client_id );
                expect( token.tokenValue ).toEqual( accessToken );
                calledHandler = true;
                return true;
            }
        }
       
        const adobeIMS = new AdobeIMS( adobeIdData );
        await adobeIMS.onPopupMessage( url );   
        expect( calledHandler ).toBeTrue();
        expect( urlSpy ).not.toHaveBeenCalled();
    } )

    it( "calls modal handler if present on the adobeIdData, then redirects if handler returns false", async ( ) => {
        const urlSpy = spyOn( UrlHelper, "replaceUrl" ).and.callFake( ()=> { 
            // don't redirect
        } );

        let calledHandler = false;
        const adobeIdData = {
            ...window[AdobeIdKey],
            onModalModeSignInComplete: ( token: TokenFields ): boolean => {
                expect( token.client_id ).toEqual( adobeIdData.client_id );
                expect( token.tokenValue ).toEqual( accessToken );
                calledHandler = true;
                return false;
            }
        }
       
        const adobeIMS = new AdobeIMS( adobeIdData );
        await adobeIMS.onPopupMessage( url );
        expect( calledHandler ).toBeTrue();
        expect( urlSpy ).toHaveBeenCalledWith( url );
    } )

    it( "redirects if no handler is present", async ( ) => {
        const urlSpy = spyOn( UrlHelper, "replaceUrl" );
       
        const adobeIMS = new AdobeIMS( );
        await adobeIMS.onPopupMessage( url );   
        expect( urlSpy ).toHaveBeenCalledWith( url );
    } )
} )

describe( "IMSLib initialized in modal window",  () => {
    it( "falls back to BroadcastMessage if opener is not present", async () => {
        const adobeIMS = new AdobeIMS();
        spyOn( ( adobeIMS as any ).tokenService, 'getTokenAndProfile' )
            .and.callFake( () => Promise.reject( new ModalSignInEvent( "" ) ) )
        const closeFn = window.close;
        window.opener = null;
        window.close = console.log;
        const bc = new BroadcastChannel( "imslib" );
        let redirect = "none";
        bc.onmessage = ( event )=> {redirect = event.data};
        await adobeIMS.initialize();
        window.close = closeFn;
        expect( redirect ).toEqual( 'http://localhost:9235/' );
    } )
} )

describe( "social headless sign in", () => {
    it( "calls the social headless endpoint, then exchanges ijt", async () => {
        const adobeIMS = new AdobeIMS();
        const headlessApiSpy = spyOn( adobeIMS.imsApis, 'socialHeadlessSignIn' )
            .and.resolveTo( { token: 'fake_token', token_type: 'implicit_jump', expires_in: 1 } );
        const access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJhX2NsaWVudCIsInVzZXJfaWQiOiJhX3VzZXIiLCJzY29wZSI6ImFfc2NvcGUiLCJzaWQiOiJhX3NpZCIsImltcF9pZCI6ImFuX2lkIiwiaW1wX3NpZCI6ImFfc2lkIn0.j7kjpo6ZdD_fVQGjeKqHN2CATaewWGBc4iUJKuS3oNA';
        const exchangeIjtSpy = spyOn( adobeIMS.imsApis, 'exchangeIjt' )
            .and.resolveTo( { 
                valid: true, 
                access_token,
                expires_in:1, 
                profile: {
                    email:'some@email.com'
                } } );
        
        const response = await adobeIMS.socialHeadlessSignIn( 
            {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                provider_id: 'google',
                idp_token: 'fake_token',
                accepted_tou_list:['ADOBE_MASTER', 'ANOTHER_TOU'],
                state:{ nonce: 'some_nonce' }
            }, {}
        );
        expect( headlessApiSpy ).toHaveBeenCalled();
        expect( exchangeIjtSpy ).toHaveBeenCalled();
        expect ( response.profile ).toEqual( { email:'some@email.com' } );
        expect ( response.tokenFields.tokenValue ).toEqual( access_token );
    } );

    it( "performs sign in when the headles API returns a ride error", async () => {
        const adobeIMS = new AdobeIMS();
        const headlessApiSpy = spyOn( adobeIMS.imsApis, 'socialHeadlessSignIn' )
            .and.rejectWith( {
                "error": "ride_AdobeID_social",
                "error_description": "User action needed",
                "error_type": "recoverable_user"
            } );
        const signInSpy = spyOn( adobeIMS, 'signIn' ).and.stub();
        try{
            await adobeIMS.socialHeadlessSignIn( 
                {
                    client_id: 'IMSLibJSTestClient',
                    scope: 'adobeid',
                    provider_id: 'google',
                    idp_token: 'fake_token',
                    accepted_tou_list:['ADOBE_MASTER', 'ANOTHER_TOU'],
                    state:{ nonce: 'some_nonce' }
                }, {}
            );
        }catch( err ) {
            expect( err.error ).toEqual( 'ride_AdobeID_social' );
        }
        expect( headlessApiSpy ).toHaveBeenCalled();
        expect( signInSpy ).toHaveBeenCalledWith( {
            idp_flow: 'social.native',
            provider_id: 'google',
            idp_token: 'fake_token'
        } );
    } );
} );