import { FragmentException } from './../../src/token/FragmentException';
import { TokenService } from './../../src/token/TokenService';

import { AdobeIdData } from '../../src/adobe-id/AdobeIdData';
import { TokenFields } from '../../src/token/TokenFields';
import { ImsApis } from '../../src/ims-apis/ImsApis';
import { ITokenServiceRequest } from '../../src/adobe-ims/facade/ITokenServiceRequest';
import TokenHelper from './../helpers/token-helper';
import FragmentHelper from '../../src/url/FragmentHelper';
import { CsrfService } from '../../src/adobe-ims/csrf/CsrfService';
import { IErrorType } from '../../src/adobe-id/IErrorType';
import { RideException } from '../../src/token/RideException';
import adobeIdDataValues from './test-data';
import { TokenExpiredException } from '../../src/token/TokenExpiredException';
import { IFragmentExceptionType } from '../../src/token/IFragmentExceptionType';
import { IRefreshTokenResponse } from '../../src/token/IRefreshTokenResponse';
import { HttpErrorResponse } from '../../src/error-handlers/HttpErrorResponse';
import { TokenProfileResponse } from '../../src/adobe-ims/TokenProfileResponse';
import Xhr from '../../src/ims-apis/xhr/Xhr';
import Debouncer from '../../src/debounce/Debouncer';
import ImsXhr from '../../src/ims-apis/xhr/ImsXhr';
import Environment from '../../src/adobe-ims/environment/Environment';
import { ModalSignInEvent } from '../../src/token/ModalSignInEvent';
const createAdobeIdData = ( overrideParams = {}, data = adobeIdDataValues ): AdobeIdData => new AdobeIdData( { ...data, ...overrideParams } );
const adobeIdData: AdobeIdData = createAdobeIdData();

const ONE_HOUR_MS = 60 * 60 * 1000; 

const imsApis = new ImsApis( );
const startDate = new Date();
const tokenFieldsData = TokenHelper.tokenFieldsData( startDate );

const tokenServiceRequest: ITokenServiceRequest = {
    clientId: adobeIdData.client_id,
    scope: adobeIdData.scope,
    imsApis,
    useLocalStorage: false,
};

const csrfService = new CsrfService( adobeIdData.client_id )
const tokenService = new TokenService( tokenServiceRequest, csrfService );

describe( 'Token Service', () => {

    it( 'validateToken', ( done ) => {

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( { status: 200,
                data: { age: 2 }
            } );
        } );

        tokenServiceRequest.imsApis.validateToken( {
            token: 'token',
            client_id: 'IMSLibJSTestClient'
        } ).then( v => {
            expect( v ).toEqual( { age: 2 } );
            done();
        } )
        
    } );

    
    it( 'validateToken', ( done ) => {
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 0,
                message: 'Network Error',
            } );
        } );

        spyOn( tokenService, 'getTokenFieldsFromStorage' ).and.callFake( function () {
            return new TokenFields( tokenFieldsData, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        } );        
        
        tokenService.validateToken().catch( ex => {
            expect( ex ).toEqual( new HttpErrorResponse( { code: 0, error: 'networkError', message: '' } ) );
            done();
        } );
    } );

    describe( 'stores data with scopes sorted', ()=> {
        const expiresAt = new Date( new Date().getTime() + ONE_HOUR_MS );
        const customTokenFieldsData = TokenHelper.tokenFieldsDataWithScope( new Date(), 'openid,adobeid' );
        const customTokenService: any = new TokenService( { ...tokenServiceRequest, scope:'openid,adobeid' }, csrfService );
        const key = customTokenService.getAccessTokenKey();
        const tokenFields: TokenFields = new TokenFields( customTokenFieldsData, expiresAt );

        it( 'constructs correct storage key', ()=> {
            expect( customTokenService.getAccessTokenKey() ).toContain( 'adobeid,openid' );
        } );

        it( 'saves data to storage key', ()=> {
            customTokenService.addTokenToStorage( tokenFields );
            const expected = JSON.stringify( { ...tokenFields, state: {}, other: '{}' } );
            expect( customTokenService.storage.getItem( key ) ).toEqual( expected );
        } );

        it( 'removes data from storage key', () => {
            customTokenService.removeTokenFromLocalStorage();
            expect( customTokenService.storage.getItem( key ) ).toBeFalsy();
        } );
    } );

    it( 'add token to local storage', ( done ) => {
        const tokenFields: TokenFields = new TokenFields( tokenFieldsData, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        tokenService.addTokenToStorage( tokenFields );
        const storageToken = tokenService.getTokenFieldsFromStorage();

        expect( storageToken && storageToken.tokenValue ).toEqual( tokenFields.tokenValue );

        done();
    } );
    
    it( 'add reauth token to local storage', ( done ) => {
        const startDate = new Date();
        const tokenValue = TokenHelper.reauthToken( startDate );
        const reauthToken = {
            ...tokenFieldsData,
            tokenValue,
        };

        const tokenFields: TokenFields = new TokenFields( reauthToken, new Date( new Date().getTime() + ONE_HOUR_MS ) );

        tokenService.addTokenToStorage( tokenFields );

        const storageToken = tokenService.getTokenFieldsFromStorage( true );
        expect( storageToken && storageToken.tokenValue ).toEqual( tokenValue );

        done();
    } );

    it( 'remove reauth token from local storage', ( done ) => {

        tokenService.removeReauthTokenFromLocalStorage();

        const storageToken = tokenService.getTokenFieldsFromStorage( true );
        expect( storageToken ).toEqual( null );

        done();
    } );

    it( 'remove token from local storage', ( done ) => {

        tokenService.removeTokenFromLocalStorage();

        const storageToken = tokenService.getTokenFieldsFromStorage();
        expect( storageToken ).toEqual( null );

        done();
    } );


    it( 'getToken should return exception if api is not allowed', ( done ) => {
        const startDate = new Date();
        const access_token = TokenHelper.defaultToken( startDate );
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                access_token,
                expires_in: '500000',
                api: 'notauth',
                from_ims: true,
            }
        } );

        const tokenResponse = tokenService.getTokenFields();
        expect( ( tokenResponse as FragmentException ).type ).toEqual( IErrorType.NOT_ALLOWED );

        done();
    } );

    it( 'getToken should return token if is in fragment and is valid', ( done ) => {

        const nonce = csrfService.initialize();
        const startDate = new Date();
        const access_token = TokenHelper.defaultToken( startDate );

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                access_token,
                state: { nonce },
                expires_in: '500000',
                api: 'authorize',
                from_ims: 'true',
            }
        } );

        const tokenResponse = tokenService.getTokenFields() as TokenFields;
        expect( tokenResponse.tokenValue ).toEqual( access_token )

        done();
    } );

    it( 'getToken should fail if nonce is empty on authorize and local storage available', ( done ) => {

        const startDate = new Date();
        const access_token = TokenHelper.defaultToken( startDate );
        const nonce = '';

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                access_token,
                expires_in: '500000',
                state: { nonce },
                api: 'authorize',
                from_ims: true,
            }
        } );

        const tokenResponse = tokenService.getTokenFields();
        expect( tokenResponse instanceof FragmentException ).toBeTruthy();

        done();
    } );

    it( 'getToken should return reauth token if is in fragment and is valid', ( done ) => {
        const nonce = csrfService.initialize();
        const startDate = new Date();
        const access_token = TokenHelper.reauthToken( startDate );
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                scope: 'adobeid',
                access_token,
                expires_in: '500000',
                state: { nonce },
                api: 'authorize',
                from_ims: true,
            }
        } );

        const response = tokenService.getTokenFields() as TokenFields;

        expect( response.tokenValue ).toEqual( access_token );
        done();
    } );

    it( 'getToken should return expired token if is in fragment and is valid', ( done ) => {

        const nonce = csrfService.initialize();
        const expiredTokenValue = TokenHelper.expiredToken();

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'adobeid',
                access_token: expiredTokenValue,
                expires_in: '-7000',
                state: { nonce },
            }
        } );
        const storageTokenFields = tokenService.getTokenFieldsFromStorage() as TokenFields;
        const tokenResponse = tokenService.getTokenFields() as TokenFields;

        expect( tokenResponse.tokenValue ).toEqual( storageTokenFields.tokenValue );

        done();
    } );

    it( 'getToken should return token exists in storage and it is valid', ( done ) => {
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return null;
        } );
        const storageTokenFields = tokenService.getTokenFieldsFromStorage() as TokenFields;
        const tokenResponse = tokenService.getTokenFields() as TokenFields;

        expect( tokenResponse.tokenValue ).toEqual( storageTokenFields.tokenValue );

        done();
    } );

    it( 'getToken should throw if is in fragment and is not valid', ( done ) => {

        const startDate = new Date();
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'IMSLibJSTestClient',
                api: 'authorize',
                scope: 'scope',
                access_token: TokenHelper.defaultToken( startDate ),
                expires_in: '500',
                from_ims: true,
            }
        } );

        const response = tokenService.getTokenFields() as FragmentException;
        expect( response.type ).toEqual( IErrorType.CSRF );

        done();
    } );

    it( 'getToken should throw if is in fragment and is not valid', ( done ) => {

        const startDate = new Date();
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                client_id: 'cli1',
                api: 'authorize',
                scope: 'scope',
                access_token: TokenHelper.defaultToken( startDate ),
                expires_in: '500',
                from_ims: true,
            }
        } );

        const response = tokenService.getTokenFields();
        expect( response ).toBeDefined();

        done();
    } );

    it( 'getToken should throw if not valid', ( done ) => {

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return null;
        } );

        spyOn( tokenService, 'getTokenFieldsFromStorage' ).and.callFake( () => null );

        const response = tokenService.getTokenFields()
        expect( response ).toEqual( null );

        done();
    } );

    it( 'getToken should return FragmentException if there is a error', ( done ) => {

        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                from_ims: true,
                error: 'error occured',
                client_id: 'IMSLibJSTestClient',
            };
        } );

        const response = tokenService.getTokenFields();
        const isFragmentException = response instanceof FragmentException;
        expect( isFragmentException ).toEqual( true );

        done();
    } );

    it( 'getToken should return null if no fragment and no storage', ( done ) => {

        tokenService.removeTokenFromLocalStorage();

        const response = tokenService.getTokenFields();

        expect( response ).toEqual( null );

        done();
    } );

    it( 'getTokenAndProfile should throw exception if get token returns any error !== NoTokenException', ( done ) => {

        const getTokenError: FragmentException = new FragmentException( IFragmentExceptionType.FRAGMENT, 'custom' );
        spyOn( tokenService, 'getTokenFields' ).and.callFake( () => getTokenError );
        const refreshTokenSpy = spyOn( tokenService, 'refreshToken' );

        const tokenPromise = tokenService.getTokenAndProfile();

        tokenPromise
            .catch( ex => {
                expect( ex ).toEqual( getTokenError );
                expect( refreshTokenSpy ).not.toHaveBeenCalled();
                done();
            } )
    } );

    it( "getTokenAndProfile should return  ", ( done ) => {
    
        spyOn( FragmentHelper, 'fragmentToObject' ).and.callFake( function () {
            return {
                state: {
                    imslibmodal: true,
                    nonce: 'nonce',
                }
            }
        } );
    
        tokenService.getTokenAndProfile()
            .catch( ex => {
                expect( ex instanceof ModalSignInEvent ).toBeTruthy();
                done();
            } )
    
    } );
           

    it( 'getTokenAndProfile should call refreshToken if error === NoTokenException', ( done ) => {

        spyOn( tokenService, 'getTokenFields' ).and.callFake( () => null );

        const refreshTokenError = { weird: 1 };
        const refreshTokenSpy = spyOn( tokenService, 'refreshToken' ).and.callFake( () => {
            return Promise.reject( new TokenExpiredException( refreshTokenError ) );
        } );

        tokenService.getTokenAndProfile()
            .catch( ex => {
                expect( ex ).toEqual( new TokenExpiredException( refreshTokenError ) );
                expect( refreshTokenSpy ).toHaveBeenCalled();
                done();
            } )
    } );

    it( 'getValidTokenAndProfile should call refreshToken if error === NoTokenException and returns RideException', ( done ) => {

        spyOn( tokenService, 'getTokenFields' ).and.callFake( () =>  null );

        const refreshTokenError = new RideException( 'ride_AdobeID_acct_actreq', 'url' );
        const refreshTokenSpy = spyOn( tokenService, 'refreshToken' ).and.callFake( () => {
            return Promise.reject( refreshTokenError )
        } );

        tokenService.getTokenAndProfile()
            .catch( ex => {
                expect( ex ).toEqual( refreshTokenError );
                expect( refreshTokenSpy ).toHaveBeenCalled();
                done();
            } )
    } );
    
    it( 'getTokenAndProfile should call refreshToken and return TokenProfileResponse', ( done ) => {

        spyOn( tokenService, 'getTokenFields' ).and.callFake( () => {
            return null;
        } );



        const createRefreshTokenResponse = (): IRefreshTokenResponse => {
            const startDate = new Date();
            const tokenFieldsData = TokenHelper.tokenFieldsData( startDate );
            const tokenFields: TokenFields = new TokenFields( tokenFieldsData, new Date( new Date().getTime() + ONE_HOUR_MS ) );

            return {
                tokenInfo: {
                    token: tokenFields.tokenValue,
                    expire: tokenFields.expire,
                    token_type: '',
                    sid: '',
                },
                profile: {
                    name: 'John'
                },
            }
        };

        const refreshTokenResponse = createRefreshTokenResponse();

        const refreshTokenSpy = spyOn( tokenService, 'refreshToken' ).and.callFake( () => {
            return Promise.resolve( refreshTokenResponse );
        } );

        tokenService.getTokenAndProfile()
            .then( ( v: any ) => {
                expect( refreshTokenSpy ).toHaveBeenCalled();
                expect( v.profile ).toEqual( refreshTokenResponse.profile );
                done();
            } )
    } );

    it( 'refresh token', ( done ) => {

        const updateTokenSpy = spyOn( tokenService, 'updateToken' );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { name: 'John' },
            } );
        } );

        tokenService.refreshToken( {
        } ).then ( () => {
            expect( updateTokenSpy ).toHaveBeenCalled();

            done();
        } )

    } );

    it( 'refresh token with user_id', ( done ) => {

        const tokenDataWithUserId = {
            ...tokenFieldsData,
            user_id: 'userId',
        }
        spyOn( tokenService, 'getTokenFieldsFromStorage' ).and.callFake( function () {
            return new TokenFields( tokenDataWithUserId, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        } );
        const updateTokenSpy = spyOn( tokenService, 'updateToken' );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { name: 'John' },
            } );
        } );
        
        const xhrPostSpy = spyOn( ImsXhr, 'post' ).and.callThrough();

        const url = `https://adobeid-na1-stg1.services.adobe.com/ims/check/v6/token?jslVersion=${Environment.jslibver}`;

        const headers = { "content-type": 'application/x-www-form-urlencoded;charset=utf-8', 'client_id' : 'IMSLibJSTestClient' };

        tokenService.refreshToken( {
        } ).then ( () => {
            expect( updateTokenSpy ).toHaveBeenCalled();

            expect( xhrPostSpy ).toHaveBeenCalledWith( url, 'client_id=IMSLibJSTestClient&scope=adobeid&user_id=user_id', headers );

            done();
        } )

    } );



    it( 'refresh token returns empty response', ( done ) => {

        const updateTokenSpy = spyOn( tokenService, 'updateToken' );
        const removeTokenFromLocalStorageSpy = spyOn( tokenService, 'removeTokenFromLocalStorage' );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: null,
            } );

        } );

        tokenService.refreshToken( {
        } )
            .catch( ex => {
                expect( ex ).toEqual( new TokenExpiredException( new Error( "refresh token --> no response" ) ) );
                expect( updateTokenSpy ).not.toHaveBeenCalled();
                expect( removeTokenFromLocalStorageSpy ).toHaveBeenCalled();

                done();
            } );

    } )

    it( 'refresh token returns ride error', ( done ) => {

        const updateTokenSpy = spyOn( tokenService, 'updateToken' );
        const removeTokenFromLocalStorageSpy = spyOn( tokenService, 'removeTokenFromLocalStorage' );

        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 500,
                data: { error: 'ride_AdobeID_acct_actreq' }
            } );
        } );

        tokenService.refreshToken( {
        } )
            .catch( ex => {
                expect( ex ).toEqual( new RideException( 'ride_AdobeID_acct_actreq', '' ) )
            } );

        expect( updateTokenSpy ).not.toHaveBeenCalled();
        expect( removeTokenFromLocalStorageSpy ).not.toHaveBeenCalled();

        done();
    } )

    it( 'create token fields from a IMSLib v1 structure', () => {
        const tokenFieldsInfo = {
            ...tokenFieldsData,
        };
        tokenFieldsInfo.access_token = tokenFieldsInfo.tokenValue;
        tokenFieldsInfo.expiresAtMilliseconds = new Date( Date.now() + 60000 ).getTime();

        spyOn( tokenService, "getItemFromStorage" ).and.returnValue( JSON.stringify( tokenFieldsInfo ) );

        delete tokenFieldsInfo.tokenValue;

        const tokenFields: TokenFields | null = tokenService.getTokenFieldsFromStorage();

        expect( tokenFields && tokenFields.validate( tokenFieldsInfo.client_id, tokenFieldsInfo.scope ) ).toBe( true );

    } );



    it( 'getTokenAndProfile should call callValidateTokenApi if autoValidateToken and throw exception', ( done ) => {

        const tokenServiceWithValidation = new TokenService( { ...tokenServiceRequest, autoValidateToken: true }, csrfService );

        const tokenFields: TokenFields = new TokenFields( { ...tokenFieldsData, valid: false }, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        spyOn( tokenServiceWithValidation, 'getTokenFields' ).and.callFake( () => tokenFields );

        const callValidateTokenApiSpy = spyOn<any>( tokenServiceWithValidation, 'callValidateTokenApi' ).and.callFake( () => Promise.reject( 'api exception' ) );

        const refreshTokenError = { weird: 1 };
        const refreshTokenSpy = spyOn( tokenServiceWithValidation, 'refreshToken' ).and.callFake( () => {
            return Promise.reject( new TokenExpiredException( refreshTokenError ) );
        } );

        tokenServiceWithValidation.getTokenAndProfile()
            .catch( ex => {
                expect( callValidateTokenApiSpy ).toHaveBeenCalled();
                expect( ex ).toEqual( new TokenExpiredException( refreshTokenError ) );
                expect( refreshTokenSpy ).toHaveBeenCalled();
                done();
            } )
    } );

    it( 'getTokenAndProfile should call NOT callValidateTokenApi if token is from fragment', ( done ) => {

        const tokenServiceWithValidation = new TokenService( { ...tokenServiceRequest, autoValidateToken: true }, csrfService );

        const tokenFields: TokenFields = new TokenFields( { ...tokenFieldsData, valid: false }, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        tokenFields.fromFragment = true;
        spyOn( tokenServiceWithValidation, 'getTokenFields' ).and.callFake( () => tokenFields );

        const callValidateTokenApiSpy = spyOn<any>( tokenServiceWithValidation, 'callValidateTokenApi' ).and.callFake( () => Promise.reject( 'api exception' ) );

        const refreshTokenError = { weird: 1 };
        const refreshTokenSpy = spyOn( tokenServiceWithValidation, 'refreshToken' ).and.callFake( () => {
            return Promise.reject( new TokenExpiredException( refreshTokenError ) );
        } );

        tokenServiceWithValidation.getTokenAndProfile()
            .then( value => {
                expect( value ).toEqual( new TokenProfileResponse( tokenFields, null ) );
                expect( callValidateTokenApiSpy ).not.toHaveBeenCalled();
                expect( refreshTokenSpy ).not.toHaveBeenCalled();
                done();
            } )
    } );

    it( 'getTokenAndProfile should call callValidateTokenApi if autoValidateToken and resolve', ( done ) => {

        const tokenServiceWithValidation = new TokenService( { ...tokenServiceRequest, autoValidateToken: true }, csrfService );

        const tokenFields: TokenFields = new TokenFields( { ...tokenFieldsData }, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        spyOn( tokenServiceWithValidation, 'getTokenFields' ).and.callFake( () => tokenFields );

        const callValidateTokenApiSpy = spyOn<any>( tokenServiceWithValidation, 'callValidateTokenApi' ).and.callFake( () => Promise.resolve( tokenFields ) );
        callValidateTokenApiSpy.calls.reset();

        const refreshTokenError = { weird: 1 };
        const refreshTokenSpy = spyOn( tokenServiceWithValidation, 'refreshToken' ).and.callFake( () => {
            return Promise.reject( new TokenExpiredException( refreshTokenError ) );
        } );

        tokenServiceWithValidation.getTokenAndProfile()
            .then( () => {
                expect( callValidateTokenApiSpy ).toHaveBeenCalled();
                expect( refreshTokenSpy ).not.toHaveBeenCalled();

                done();
            } )
    } );

    it( 'getReleaseFlags returns data', ( done ) => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );

        const tokenFields: TokenFields = new TokenFields( { ...tokenFieldsData }, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        spyOn( tokenService, 'getTokenFieldsFromStorage' ).and.callFake( () => tokenFields );
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { name: 'John' }
            } );
        } );

        tokenService.getReleaseFlags().then( v => {
            expect( v ).toEqual( { name: 'John' } );
            done();
        } )

    } );

    it( 'getReleaseFlags throws error', ( done ) => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );

        const tokenFields: TokenFields = new TokenFields( { ...tokenFieldsData }, new Date( new Date().getTime() + ONE_HOUR_MS ) );
        spyOn( tokenService, 'getTokenFieldsFromStorage' ).and.callFake( () => tokenFields );

        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, config: any = {} ) {
            return Promise.reject( {
                status: 404,
                data: null,
            } );
        } );

        tokenService.getReleaseFlags().catch( () => {
            done();
        } )

    } );

    it( 'switch profile', ( done ) => {

        const updateTokenSpy = spyOn( tokenService, 'updateToken' );
        spyOn( Xhr, 'post' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { name: 'John' },
            } );
        } );

        tokenService.switchProfile( "userid" ).then ( () => {
            expect( updateTokenSpy ).toHaveBeenCalled();

            done();
        } )

    } );

    it( 'exchange ijt fails', ( done ) => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );
        const getSpy = spyOn( Xhr, 'get' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.reject( {
                status: 406,
                data: { valid: false },
            } );
        } );

        tokenService.exchangeIjt( "userid" ).catch( ex => {
            expect( ex ).toEqual( { valid: false } );
            getSpy.calls.reset();
            done();
        } )

    } );

    it( 'exchange ijt return data', ( done ) => {
        spyOn( Debouncer, 'getCachedApiResponse' ).and.callFake( () => null );

        const EXPIRATION_SECONDS = 5000;
        const ONE_SECOND_MILLIS = 1000;

        const profile = { email: 'some@email.com' };
        const startDate = new Date();
        const expirationDate =  startDate.getTime() + EXPIRATION_SECONDS * ONE_SECOND_MILLIS;
        const access_token = TokenHelper.defaultToken( startDate );
        spyOn( Xhr, 'get' ).and.callFake( function ( url: string, data: any, config: any = {} ) {
            return Promise.resolve( {
                status: 200,
                data: { 
                    access_token, 
                    expires_in: EXPIRATION_SECONDS,
                    profile
                },
            } );
        } );

        tokenService.exchangeIjt( "userid" ).then ( ( ijtResponse: TokenProfileResponse ) => {

            expect( ijtResponse.tokenFields.tokenValue ).toEqual( access_token );
            expect( ijtResponse.tokenFields.expire.getTime() ).toBeCloseTo( expirationDate, -2 );
            expect( ijtResponse.profile ).toEqual( profile );
            expect( tokenService.getTokenFieldsFromStorage()?.tokenValue ).toEqual( access_token );
            done();
        } )

    } );

    it( 'getTokenFromFragment should read a TokenFields object from a valid url', () => {
        const testClient = adobeIdData.client_id;
        const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiY2xpZW50X2lkIjoiSU1TTGliSlNUZXN0Q2xpZW50In0.hNBBMe1UY6tsLw7b9xAa9Cs_As-s2saAzZVv5r7rijc";
        const nonce = csrfService.initialize();
        const re: any = tokenService.getTokenFromFragment( `https://test.com/?#old_hash=&from_ims=true&client_id=${testClient}&api=authorize&scope=testScope#access_token=${accessToken}&state=%7B%22nonce%22%3A%22${nonce}%22%7D&token_type=bearer&expires_in=86399997` );
        
        expect ( re instanceof TokenFields ).toBeTrue();
        expect( re.client_id ).toEqual( testClient );
        expect ( re.tokenValue ).toEqual( accessToken );
    } );

} );
