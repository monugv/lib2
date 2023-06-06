/* eslint-disable @typescript-eslint/camelcase */

import { IDictionary } from './../facade/IDictionary';
import { ITokenServiceRequest } from '../adobe-ims/facade/ITokenServiceRequest';
import StorageFactory from './../storage/StorageFactory';
import { STORAGE_MODE, TOKEN_STORAGE_KEY } from '../constants/ImsConstants';
import { TokenFields } from './TokenFields';
import { IRefreshTokenResponse } from './IRefreshTokenResponse';
import FragmentHelper from '../url/FragmentHelper';
import { FragmentException } from './FragmentException';
import { CsrfService } from '../adobe-ims/csrf/CsrfService';
import { IFragmentExceptionType } from './IFragmentExceptionType';
import { TokenProfileResponse } from '../adobe-ims/TokenProfileResponse';
import { RideException } from './RideException';
import { TokenExpiredException } from './TokenExpiredException';
import Log from '../log/Log';
import { HttpErrorResponse } from '../error-handlers/HttpErrorResponse';
import { StandaloneToken } from './StandaloneToken';
import { ITokenInformation } from '../adobe-id/custom-types/CustomTypes';
import { AuthorizationCode } from './AuthorizationCode';
import { ModalSignInEvent } from '../token/ModalSignInEvent';
import { CodeChallenge } from '../adobe-ims/pkce/code-challenge';
import { IUnAuthorizedApiRequest } from '../ims-apis/IUnAuthorizedApiRequest';
import { sortScopes } from '../util/ScopeUtil';
import { decodeToBitstring } from '../util/Base32Util';

const ALLOWED_FRAGMENT_APIS = ['authorize', 'check_token']
const ONE_SECOND_MILLIS = 1000;

/**
 * class used to store the specific token methods
 */
export class TokenService {

       /**
        * local storage instance used to manage with the tokens
        */
       storage: Storage;
       tokenServiceRequest: ITokenServiceRequest;

       private csrfService: CsrfService;
       constructor ( tokenServiceRequest: ITokenServiceRequest, csrfService: CsrfService ) {
           const { useLocalStorage } = tokenServiceRequest;
           this.csrfService = csrfService;
           this.tokenServiceRequest = tokenServiceRequest;
           this.storage = StorageFactory.getStorageByName( useLocalStorage? STORAGE_MODE.LocalStorage : STORAGE_MODE.SessionStorage );
       }

       /**
        * 
        * @returns {TokenFields} representing the token fields from fragment or local storage
        */
       getTokenFields (): TokenFields | FragmentException | ModalSignInEvent | AuthorizationCode | null {
           const { clientId, scope } = this.tokenServiceRequest;
           const fragmentResult: TokenFields | FragmentException | ModalSignInEvent | AuthorizationCode | null = this.getTokenFromFragment();

           if ( fragmentResult instanceof ModalSignInEvent ) {
               return fragmentResult;
           }

           if ( fragmentResult instanceof FragmentException ) {
               return fragmentResult;
           }

           if( fragmentResult instanceof AuthorizationCode ) {
               return fragmentResult;
           }

           if ( fragmentResult && fragmentResult.validate( clientId, scope ) ) {
               fragmentResult.fromFragment = true;
               this.addTokenToStorage( fragmentResult );
               return fragmentResult;
           }

           return this.getTokenFieldsFromStorage();
       }


       /**
        * method used to validate the local storage token value
        */
       validateToken (): Promise<TokenFields> {

           const tokenFields = this.getTokenFieldsFromStorage();
           if ( !tokenFields ) {
               return Promise.reject( null );
           }

           return this.callValidateTokenApi( tokenFields.tokenValue );
       }

       /**
        * method used to retrieve the token release flags
        */
       getReleaseFlags (): Promise<any> {

           const { clientId, imsApis } = this.tokenServiceRequest;

           const tokenFields = this.getTokenFieldsFromStorage();
           if ( !tokenFields ) {
               return Promise.reject( null );
           }

           return imsApis.getReleaseFlags( { 
               token: tokenFields.tokenValue,
               client_id: clientId,
           } );
       }
       
       /**
        * method used to retrieve the token release flags decoded from B32
        */
       getDecodedReleaseFlags (): Promise<string> {
           return this.getReleaseFlags().then( result =>  decodeToBitstring( result.releaseFlags, true ) );
       }

       /**
        * method used to call the validate token api
        * @param token {String} validate the input token value
        */
       private callValidateTokenApi ( token: string ): Promise<TokenFields> {
           const { clientId, scope, imsApis } = this.tokenServiceRequest;

           return imsApis.validateToken( { client_id: clientId, token } )
               .then( ( tokenResponseData: any ) => {
                   Log.info( 'validateToken response', tokenResponseData );
                   const tokenFields = new TokenFields( {
                       ...tokenResponseData,
                       tokenValue: token
                   }, new Date( parseFloat( tokenResponseData.expires_at ) ) );

                   if ( tokenFields.validate( clientId, scope ) ) {
                       this.addTokenToStorage( tokenFields );
                       return Promise.resolve( tokenFields );
                   }
                   throw new Error( 'could not validate tokenFields' );
               } )
               .catch( ( ex: any ) => {
                   Log.error( 'validateToken response', ex );

                   if( ex instanceof HttpErrorResponse ) {
                       return Promise.reject( ex );
                   }

                   this.removeTokenFromLocalStorage();
                   return Promise.reject( ex );
               } )
       }

       /**
        * tries to get a valid token; if there is no token, the refresh method is called
        * @param externalParameters represents the external parameters used for refresh token
        * @returns TokenProfileResponse
        */
       getTokenAndProfile  = ( externalParameters = {} ): Promise<TokenProfileResponse> => {

           const tokenResponse: TokenFields | FragmentException | ModalSignInEvent | AuthorizationCode | null  = this.getTokenFields();

           if ( tokenResponse instanceof ModalSignInEvent ) {
               return Promise.reject( tokenResponse );
           }

           if ( tokenResponse instanceof FragmentException ) {
               return Promise.reject( tokenResponse );
           }
                
           if ( tokenResponse instanceof AuthorizationCode ) {
               const { imsApis } = this.tokenServiceRequest;

               return imsApis.getTokenFromCode( tokenResponse, externalParameters ).then( tokenApiResponse => {
                   const { access_token, state, expires_in, scope = '',  ...profile } = tokenApiResponse;
                   const tokenFields = new TokenFields(
                       {
                           scope,
                           tokenValue: access_token,
                           valid: true,
                           state,
                           other: tokenResponse.other,
                       }, new Date( new Date().getTime() + parseFloat( expires_in as string ) )
                   );
                   return Promise.resolve( new TokenProfileResponse( tokenFields, profile ) );
               } )
           }

           if ( tokenResponse instanceof TokenFields ) {
               if( tokenResponse.fromFragment || !this.tokenServiceRequest.autoValidateToken ) {
                   return Promise.resolve( new TokenProfileResponse( tokenResponse, null ) );
               }
               return this.callValidateTokenApi( tokenResponse.tokenValue ).then( () => new TokenProfileResponse( tokenResponse, null ) )
                   .catch( () =>  this.callRefreshToken( externalParameters ) ) 
           } else {
               return this.callRefreshToken( externalParameters );
           }
       }

       /**
        * @returns the object values from the url fragment
        */
       getTokenFromFragment ( url?: string ): TokenFields | FragmentException | ModalSignInEvent | AuthorizationCode | null {
           const fragmentValues: any | null = FragmentHelper.fragmentToObject( url );

           if ( !fragmentValues ) {
               return null;
           }
           
           const { access_token: token, scope, error, api, state = {}, expires_in, client_id,  code = '', ...other } = fragmentValues;
           
           const { imslibmodal, nonce } = state || {};

           if( imslibmodal === true ) {
               return new ModalSignInEvent( nonce );
           }

           if ( !fragmentValues.from_ims ) {
               return null;
           }

           if( client_id !== this.tokenServiceRequest.clientId ) {
               return null;
           }

           if ( error ) {
               return new FragmentException( IFragmentExceptionType.FRAGMENT, error as string );
           }

           if ( !ALLOWED_FRAGMENT_APIS.includes( api ) ) {
               return new FragmentException( IFragmentExceptionType.API_NOT_ALLOWED, `api should be authorize or check token and ${api} is used` );
           }
           const validCsrf = this.csrfService.verify( nonce );

           if ( !validCsrf ) {
               return new FragmentException( IFragmentExceptionType.CSRF, 'CSRF exception' );
           }

           if( code ) {
               const codeChallenge= new CodeChallenge();
               const verifier = codeChallenge.getVerifierByKey( nonce );
               if( !verifier ) {
                   throw new Error( 'no verifier value has been found' );
               }

               return new AuthorizationCode( { ...fragmentValues, verifier } );
           }

           if ( !token ) {
               return null;
           }

           const tokenFields = new TokenFields(
               {
                   client_id,
                   scope,
                   tokenValue: token as string,
                   valid: true,
                   state,
                   other
               }, new Date( new Date().getTime() + parseFloat( expires_in as string ) )
           );

           return tokenFields;
       }

       getItemFromStorage ( key: string ): string | null {
           return this.storage.getItem( key );
       }

       /**
        * @returns the TokenFields structure from local storage or null
        * @isReauth boolean value; true if token is for reauthentification
        */
       getTokenFieldsFromStorage ( isReauth = false ): TokenFields | null {
           const { clientId, scope } = this.tokenServiceRequest;
           const tokenStorageKey = this.getAccessTokenKey ( isReauth );
           const tokenData = this.getItemFromStorage( tokenStorageKey );

           if ( !tokenData ) {
               return null;
           }

           const parsedToken = JSON.parse( tokenData );
           const expire = parsedToken.expire ? new Date( Date.parse( parsedToken.expire ) ) : new Date( parsedToken.expiresAtMilliseconds );

           const tokenFields = new TokenFields( parsedToken, expire );

           return tokenFields.validate( clientId, scope ) ? tokenFields : null;
       }

       /**
        * private method used to compose the key used for storage
        * @param clientId 
        * @param scope 
        * @param isReAuth default false; true means that the key is for re-authentification
        */
       private getAccessTokenKey ( isReauth = false ): string {
           const { clientId, scope } = this.tokenServiceRequest;
           return `${TOKEN_STORAGE_KEY}/${clientId}/${isReauth}/${ sortScopes( scope ) }`;
       }

       /**
        * save the token into local storage
        * @param tokenFragment - object with the values from fragment
        */
       addTokenToStorage ( tokenFields: TokenFields ): void {
           if ( !tokenFields ) {
               return;
           }
           const isReauth = tokenFields.isReauth();

           const tokenStorageKey = this.getAccessTokenKey( isReauth );

           const clonedTokenFields = { ...tokenFields };
           clonedTokenFields.state = {};
           clonedTokenFields.other = '{}';

           const storagePayload = JSON.stringify( clonedTokenFields );
           this.storage.setItem( tokenStorageKey,  storagePayload );
       }


       /**
        * remove the token from local storage
        */
       removeTokenFromLocalStorage (): void {
           const tokenStorageKey = this.getAccessTokenKey();
           this.storage.removeItem( tokenStorageKey );
       }

       /**
        * remove the reauth token from local storage
        */
       removeReauthTokenFromLocalStorage (): void {
           const tokenStorageKey = this.getAccessTokenKey( true );
           this.storage.removeItem( tokenStorageKey );
       }

       /**
        * 
        * @param externalParameters external parameters received outside of the library
        * @returns IRefreshTokenResponse containing the refresh token information
        */
       refreshToken ( externalParameters: IDictionary = {} ): Promise<IRefreshTokenResponse> {

           const { clientId, imsApis, scope } = this.tokenServiceRequest;

           const tokenFields: TokenFields | null = this.getTokenFieldsFromStorage();
           const userId = tokenFields ? tokenFields.user_id : ''; 

           return imsApis.checkToken( {
               client_id: clientId,
               scope,
           }, externalParameters, userId )
               .then( ( data: any ) => {
                   if ( !data ) {
                       throw new Error( 'refresh token --> no response' );
                   }
                   const { access_token, expires_in, token_type, error, error_description = '', sid, ...profileValues } = data;

                   if( error ) {
                       throw new Error( `${error} ${error_description}` );
                   }

                   const profile = Object.keys( profileValues ).length ? profileValues : null;

                   const tokenInfo = {
                       token: access_token,
                       expire: new Date( Date.now() + parseFloat( expires_in ) ),
                       token_type,
                       sid,
                   }
 
                   const tokenFields: any = this.updateToken( tokenInfo ) || {};
                   
                   const refreshTokenResponse: IRefreshTokenResponse = {
                       tokenInfo: {
                           ...tokenInfo,
                           impersonatorId: tokenFields.impersonatorId || '',
                           isImpersonatedSession: tokenFields.isImpersonatedSession || false,
                           pbaSatisfiedPolicies: tokenFields.pbaSatisfiedPolicies || []
                       },
                       profile
                   };

                   return Promise.resolve( refreshTokenResponse );
               } )
               .catch( ( refreshTokenException: any = {} ) => {
                   if( refreshTokenException instanceof HttpErrorResponse ) {
                       return Promise.reject( refreshTokenException );
                   }
                   if( refreshTokenException instanceof RideException ) {
                       return Promise.reject( refreshTokenException );
                   }

                   this.removeTokenFromLocalStorage();
                   return Promise.reject( new TokenExpiredException( refreshTokenException ) );
               } )


       }


       /**
        * function used to change the user profile
        * @param externalParameters external parameters received outside of the library
        * @param userId {String} represents the user id used to get the new token and profile
        * @returns IRefreshTokenResponse containing the refresh token information
        */
       switchProfile ( userId: string, externalParameters: IDictionary = {} ): Promise<IRefreshTokenResponse> {

           const { clientId, imsApis, scope } = this.tokenServiceRequest;

           return imsApis.switchProfile( {
               client_id: clientId,
               scope,
           }, externalParameters, 
           userId ).then( ( data: any ) => {
               
               if ( !data ) {
                   throw new Error( 'refresh token --> no response' );
               }
               const { access_token, expires_in, token_type, error, error_description = '', sid, ...profileValues } = data;

               if( error ) {
                   throw new Error( `${error} ${error_description}` );
               }

               const profile = Object.keys( profileValues ).length ? profileValues : null;

               const tokenInfo = {
                   token: access_token,
                   expire: new Date( Date.now() + parseFloat( expires_in ) ),
                   token_type,
                   sid,
               }

               const tokenFields: any = this.updateToken( tokenInfo ) || {};

               const refreshTokenResponse: IRefreshTokenResponse = {
                   tokenInfo: {
                       ...tokenInfo, 
                       impersonatorId: tokenFields.impersonatorId || '', 
                       isImpersonatedSession: tokenFields.isImpersonatedSession || false
                   }, 
                   profile
               };

               return Promise.resolve( refreshTokenResponse );
           } )
               .catch( ( switchTokenException: any = {} ) => {
                   return Promise.reject( switchTokenException );
               } )

       }

       /**
        * 
        * @param externalParameters external parameters received outside of the library
        * @returns IRefreshTokenResponse containing the refresh token information
        */
       private callRefreshToken ( externalParameters: IDictionary = {} ): Promise<TokenProfileResponse> {
            
           return this.refreshToken( externalParameters )
               .then( ( tokenResponse: IRefreshTokenResponse ) => {

                   const { tokenInfo: { token, expire }, profile } = tokenResponse;

                   const refreshTokenFields = new TokenFields( {
                       valid: true,
                       tokenValue: token,
                   }, expire );

                   const tokenProfileResponse = new TokenProfileResponse( refreshTokenFields, profile );

                   return Promise.resolve( tokenProfileResponse );

               } )
               .catch( ( ex: RideException | TokenExpiredException ) => {
                   return Promise.reject( ex );
               } )
       }

       /**
        * update the token into local storage after a refresh action
        * @param tokenInfo {ITokenInformation}
        * 
        */
       updateToken ( tokenInfo: ITokenInformation ): TokenFields | null {
           const { token, expire } = tokenInfo;
           const tokenFields: TokenFields = new TokenFields( {
               tokenValue: token,
           }, expire );
           if ( !tokenFields ) {
               return null;
           }
                 
           tokenFields.tokenValue = token;
   
           this.addTokenToStorage( tokenFields );

           return tokenFields;
       }

       /**
        * remove the tokens from the local storage
        */
       purge (): void {
           this.removeTokenFromLocalStorage();
           this.removeReauthTokenFromLocalStorage();
       }

       /**
        * set a new access token 
        * @param tokenInfo {StandaloneToken} represents the token and expiration ms
        */
       setStandAloneToken ( standaloneToken: StandaloneToken  ): boolean {
           const { token, sid, expirems = -1 } = standaloneToken;

           const { clientId, scope } = this.tokenServiceRequest;
           const expire = new Date( new Date().getTime() + expirems );

           const tokenFields = new TokenFields( {
               valid: true,
               tokenValue: token,
           }, expire );

           if( !tokenFields.validate( clientId, scope ) ) {
               return false;
           }

           const tokenInfoToBeSaved: ITokenInformation = {
               expire,
               token,
               sid,
           };

           this.updateToken( tokenInfoToBeSaved );

           return true;
       }

       /**
        * method used during initialization in order to get a ijt token
        * @returns {Promise<TokenProfileResponse>} ijt response
        */
       exchangeIjt ( ijt: string ): Promise<TokenProfileResponse> {
           const { clientId, scope, imsApis } = this.tokenServiceRequest;
   
           const apiRequest: IUnAuthorizedApiRequest = {
               client_id: clientId,
               scope,
           }
           return imsApis.exchangeIjt( apiRequest, ijt ).then( ijtResponse => {
               const { valid, access_token, expires_in, profile } = ijtResponse;
               if( valid === false ) {
                   return Promise.reject( ijtResponse );
               }

               const expire = new Date( Date.now() + parseFloat( expires_in ) * ONE_SECOND_MILLIS );

               const ijtTokenFields = new TokenFields( {
                   valid: true,
                   tokenValue: access_token,
               }, expire );

               this.addTokenToStorage( ijtTokenFields );

               const tokenProfileResponse = new TokenProfileResponse( ijtTokenFields, profile );

               return Promise.resolve( tokenProfileResponse );

           } )
       }

}
