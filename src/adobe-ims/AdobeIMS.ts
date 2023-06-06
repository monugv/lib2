import { CsrfService } from './csrf/CsrfService';
import Log from '../log/Log';
import { SignInService } from './sign-in/SignInService';
import { SignInModalService } from './sign-in/SignInModalService';
import { SignOutService } from './sign-out/SignOutService';
import { AdobeIdData } from './../adobe-id/AdobeIdData';
import { IAdobeIdData } from "../adobe-id/IAdobeIdData";
import { IDictionary } from './../facade/IDictionary';
import { ImsApis } from './../ims-apis/ImsApis';
import { IReauth } from './facade/IReauth';
import { IRefreshTokenResponse } from '../token/IRefreshTokenResponse';
import { IServiceRequest } from './facade/IServiceRequest';
import { ProfileException } from '../profile/ProfileException';
import { ProfileService } from '../profile/ProfileService';
import { TokenService } from '../token/TokenService';
import UrlHelper from '../url/UrlHelper';
import { IRedirectSignoutRequest } from './facade/IRedirectSignoutRequest';
import FragmentHelper from '../url/FragmentHelper';
import { IErrorType } from '../adobe-id/IErrorType';
import { TokenProfileResponse } from './TokenProfileResponse';
import { TokenExpiredException } from '../token/TokenExpiredException';
import { RideException } from '../token/RideException';
import { HttpErrorResponse } from '../error-handlers/HttpErrorResponse';
import TokenAutoRefresh from './token-auto-refresh/TokenAutoRefresh';
import { StandaloneToken } from '../token/StandaloneToken';
import { ASK_FOR_IMSLIB_INSTANCE_DOM_EVENT_NAME, ON_IMSLIB_INSTANCE } from '../constants/ImsConstants';
import Environment from './environment/Environment';
import { IAdobeIMS } from './facade/IAdobeIMS';
import { ITokenInformation } from '../adobe-id/custom-types/CustomTypes';
import { ITransitoryAuthorizationRequest } from './facade/ITransitoryAuthorizationRequest';
import { ITransitoryAuthorizationResponse } from './facade/ITransitoryAuthorizationResponse';
import { IGrantTypes } from './facade/IGrantTypes';
import { ModalSignInEvent } from '../token/ModalSignInEvent';
import { ISignInService } from './sign-in/ISignInService';
import { IRedirectRequest } from './facade/IRedirectRequest';
import { IJumpTokenRequest } from './facade/IJumpTokenRequest';
import { IJumpTokenResponse } from './facade/IJumpTokenResponse';
import { CodeChallenge } from './pkce/code-challenge';
import { TokenFields } from '../token/TokenFields';
import { ISocialHeadlessSignInRequest } from './facade/ISocialHeadlessSignIn';
import { RedirectHelper } from './helpers/RedirectHelper';

/**
 * Class used as a facade for ims library in order to provide public access to library functionalities
 *
 */
export class AdobeIMS implements IAdobeIMS {

  /**
   * AdobeIdData
   * the values for adobeId are read from window.adobeid or passed by using the constructor
  */
  private adobeIdData: AdobeIdData;

  /**
   * Token Service instance used for token management
   */
  private tokenService: TokenService;

  /**
   * Profile service instance used for profile management
   */
  private profileService: ProfileService;

  /**
   * Service Request object used for token and profile services.
   * contains the clientId, scope and imsApis instance
   */
  private serviceRequest: IServiceRequest;

  /**
   * instance of CsrfService
   */
  private csrfService: CsrfService;

  private signInservice: ISignInService;

  /**
   * Represents the class used to call the back-end methods;
   * it is visible ONLY because this is the only way t mock the api calls during functional tests
  */
  imsApis: ImsApis;

  /**
   * represents the adobe ims library version
   */
  get version (): string {
      return Environment.jslibver;
  }

  /**
   * flag used to block the access to signin, signout functions in case the library is not fully initialized
   * { Boolean }; true if library is initialized, otherwise false
   */
  private initialized = false;

  /**
   * AdobeIdData
   * the values for adobeId are read from window.adobeid or passed by using the constructor
  */
  get adobeid (): IAdobeIdData {
      return { ... this.adobeIdData };
  }

  /**
   * @constructor adobeData {AdobeIdData}
   * If adobeData is not null, the adobeIdData instance will be created based on these values
   *
   * if no adobeData, the imsLibrary try to read these values from window.adobeid
   *
   * After this AdobeIms class is created, it can be accessed by window[{adobeData.clientId}]
  */
  constructor ( adobeData: IAdobeIdData | null = null ) {
      this.adobeIdData = new AdobeIdData( adobeData );
      const { api_parameters: apiParameters = {}, client_id: clientId, scope, useLocalStorage, autoValidateToken, modalMode, modalSettings } = this.adobeIdData;

      this.imsApis = new ImsApis( apiParameters );

      this.csrfService = new CsrfService( clientId );

      this.serviceRequest = {
          clientId,
          scope,
          imsApis: this.imsApis
      };

      this.tokenService = new TokenService( {
          ...this.serviceRequest,
          useLocalStorage,
          autoValidateToken,
      }, this.csrfService );

      this.profileService = new ProfileService( this.serviceRequest );

      this.signInservice = modalMode? new SignInModalService( this.onPopupMessage, modalSettings ): new SignInService();
  }


  /**
   * enable the logging mechanism
   */
  enableLogging (): void {
      Log.enableLogging();
  }

  /**
   * disable the logging mechanism
   */
  disableLogging (): void {
      Log.disableLogging();
  }

  /**
   * function used to check is initialized; in case of false, an error is triggered
   */
  private checkInitialized (): void {
      if( this.initialized ) {
          return;
      }

      //   throw new Error( 'the imslib is not yet initialized' );
  }

  /**
   *
   * @param authUrlRedirectResponse {String} represents the authorization redirect response
   */
  onPopupMessage = ( authUrlRedirectResponse: string ): Promise<any> => {
      if( !!authUrlRedirectResponse && !!this.adobeIdData.onModalModeSignInComplete ) {
          const response = this.tokenService.getTokenFromFragment( authUrlRedirectResponse );
          if( response instanceof TokenFields ) {
              this.tokenService.addTokenToStorage( response );
              if( this.adobeIdData.onModalModeSignInComplete( response ) ) {
                  return Promise.resolve();
              }
          }
      }
      UrlHelper.replaceUrl( authUrlRedirectResponse );
      return this.initialize();
  }

  /**
   * Method used to redirect the user to signin url
   *
   * <uml>
   * start
   * :SignIn;
   * :Create the state object by using appCode, appVersion (used on server side) from adobeId.analytics and contextToBePassedOnRedirect;
   * :Create the redirect url using external parameters. state object will be part of redirect url;
   * :user must enter the credentials and after that is redirected to initial uri;
   * :initialize method is used which will trigger the onAccessToken;
   * end
   * </uml>
   *
   *
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   * @param grantType {IGrantTypes} represents the grant type used for sign in flow
   *
  */
  signIn = async ( externalParameters: IDictionary = {}, contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<void> => {
      this.checkInitialized();

      const { adobeIdData, csrfService } = this;

      const nonce = csrfService.initialize();
      const authorizeRequestData = await adobeIdData.createRedirectRequest( externalParameters, contextToBePassedOnRedirect, nonce, grantType );
      this.signInservice.signIn( authorizeRequestData );
      return Promise.resolve();
  };

  /**
   * method used to sign in using an external token
   * @param token { String } token used for authorize; if the token is empty, the user will be redirected to the sign in screen
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   */
  authorizeToken = ( token = '', externalParameters: IDictionary = {}, contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<void> => {
      const { adobeIdData, csrfService } = this;

      const nonce = csrfService.initialize();

      return adobeIdData.createRedirectRequest( externalParameters, contextToBePassedOnRedirect, nonce, grantType )
          .then( ( authorizeRequestData: IRedirectRequest ) => {
              new SignInService().authorizeToken( token, authorizeRequestData );
          } )
  };


  /**
   * Method used to reAuthenticate the user
   *
   * <uml>
   * start
   * :Create the state object by using appCode, appVersion (used on server side) from adobeId.analytics and contextToBePassedOnRedirect;
   * :Create the redirect url using external parameters. state object will be part of redirect url;
   * :SignIn;
   * :user must enter the credentials and after that is redirected to initial uri;
   * :initialize method is used which will trigger the token and profile;
   * end
   *
   * </uml>
   *
   * @param requestedParameters object sent from outside in order to use diferent values for reAuthenticate
   * @param contextToBePassedOnRedirect {Object | undefined} represents the context which is passed during redirect
   * @param reauth {string}; represents the re authenticate value. available values are: check and force. default value is "check"
   *
  */
  reAuthenticate = ( requestedParameters: IDictionary = {}, reauth = IReauth.check, contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<void> => {
      this.checkInitialized();
      const { adobeIdData, csrfService } = this;

      const nonce = csrfService.initialize();
      return adobeIdData.createReAuthenticateRedirectRequest( requestedParameters, contextToBePassedOnRedirect, nonce, reauth, grantType )
          .then( ( authorizeRequestData: IRedirectRequest ) => {
              this.signInservice.signIn( authorizeRequestData );
          } )

  };

  /**
   * Method used to redirect the user to the signup screen
   *
   * <uml>
   * start
   * :Create the state object by using appCode, appVersion (used on server side) from adobeId.analytics and contextToBePassedOnRedirect;
   * :Create the redirect url using external parameters. state object will be part of redirect url;
   * :SignUp;
   * :initialize method is used which will trigger the token and profile;
   * end
   *
   * </uml>
   *
   * @param requestedParameters object sent from outside in order to use diferent values for signUp
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   *
  */
  signUp ( requestedParameters: IDictionary = {}, contextToBePassedOnRedirect?: any ): Promise<void> {
      this.checkInitialized();
      const { adobeIdData, csrfService } = this;
      if ( !adobeIdData ) {
          throw new Error( 'no adobeId on reAuthenticate' );
      }

      const nonce = csrfService.initialize();
      return adobeIdData.createSignUpRedirectRequest( requestedParameters, contextToBePassedOnRedirect, nonce )
          .then( ( authorizeRequestData: IRedirectRequest ) => {
              this.signInservice.signIn( authorizeRequestData );
          } )

  }

  /**
   * sign in with social providers
   * @param providerName provider name used for sign in
   * @param externalParameters external parameters sent by developer
   * @param contextToBePassedOnRedirect {Object} state of the application
   */
  signInWithSocialProvider = ( providerName, externalParameters: IDictionary = {}, contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): void => {
      this.checkInitialized();
      if ( !providerName ) {
          throw new Error( 'please provide the provider name' );
      }
      const { adobeIdData, csrfService } = this;

      const nonce = csrfService.initialize();
      adobeIdData.createSocialProviderRedirectRequest( providerName, externalParameters, contextToBePassedOnRedirect, nonce, grantType )
          .then( ( authorizeRequestData: IRedirectRequest ) => {
              this.signInservice.signIn( authorizeRequestData );
          } )

  };

  /**
   * @function Method used to check if the user is signed in or not.
   * if local storage contains a token and is validated (only against expiration), the result is true
   * returns {boolean}
  */
  isSignedInUser (): boolean {
      return ( this.getAccessToken() || this.getReauthAccessToken() )? true : false;
  }

  /**
   * @function Method used to get the user profile in case the user is logged)
   * returns {IDictionary | null}  representing the user profile or null
  */
  getProfile (): Promise<any> {
      const profile = this.profileService.getProfileFromStorage();
      if ( profile ) {
          return Promise.resolve( profile );
      }

      const tokenInfo = this.getAccessToken() || this.getReauthAccessToken();
      if ( !tokenInfo ) {
          const profileException = 'please login before getting the profile';
          return Promise.reject( new ProfileException( profileException ) )
      }

      return this.profileService.getProfile( tokenInfo.token ).then( ( profile: any ) => {
          return Promise.resolve( profile );
      } )
          .catch( ex => {
              Log.error( 'get profile exception ', ex );
              if( !( ex instanceof HttpErrorResponse ) ) {
                  return Promise.reject( new ProfileException( ex.message || ex ) );
              }
              return this.refreshToken().then( ( tokenResponse: IRefreshTokenResponse ) => {
                  return Promise.resolve( tokenResponse.profile );
              } )
          } )

  }

  /**
   *  Method used for sign out the user
   *
   * <uml>
   * start
   * :Signout;
   * :Create the redirect url;
   * :remove the token and profile from storage;
   * :initialize method is used which will redirect the app to initial url;
   * end
   * </uml>
   *
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   *
  */
  signOut = ( externalParameters: IDictionary = {} ): void => {
      this.checkInitialized();

      this.tokenService.purge();
      this.profileService.removeProfile();

      const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri } = this.adobeIdData;

      const redirectRequest: IRedirectSignoutRequest = {
          adobeIdRedirectUri,
          apiParameters,
          clientId,
          externalParameters,
      };

      const signOutService = new SignOutService();

      signOutService.signOut( redirectRequest );
  };

  /**
   * @function Returns the URL of the user avatar
   * @param {UserId} userId
  */
  avatarUrl ( userId: string ): string {
      return this.imsApis.avatarUrl( userId );
  }

  /**
    * method used to retrieve the token release flags
  */
  getReleaseFlags ( decode = false ): Promise<any> {
      return decode?
          this.tokenService.getDecodedReleaseFlags() :
          this.tokenService.getReleaseFlags();
  }

  /**
    *
    * Returns the access token value from the local storage
    *
    * <uml>
    * start
    * :getAccessToken;
    * :check the local storage;
    * :if token exists, it is validated against expiration;
    * :if valid the token is returned otherwise an empty token;
    * end
    * </uml>
    *
  */
  getAccessToken (): ITokenInformation | null {
      return this.getTokenFromStorage( false );
  }

  /**
   *
   * Returns the reauth access token value from the local storage
   *
   * <uml>
   * start
   * :getReauthAccessToken;
   * :check the local storage;
   * :if token exists, it is validated against expiration;
   * :if valid the token is returned otherwise an empty token;
   * end
   * </uml>
   *
 */
  getReauthAccessToken (): ITokenInformation | null {
      return this.getTokenFromStorage( true );
  }

  private getTokenFromStorage ( isReauth: boolean ): any {
      const tokenFields = this.tokenService.getTokenFieldsFromStorage( isReauth );
      if( !tokenFields ) {
          return null;
      }
      const { tokenValue: token, expire, sid, impersonatorId, isImpersonatedSession, pbaSatisfiedPolicies } = tokenFields;
      return { token, expire, sid, impersonatorId, isImpersonatedSession, pbaSatisfiedPolicies };
  }

  /**
   * method used to get the social providers.
   * returns Promise - can be used to determine when the call has been ended and read the social providers response
   */
  listSocialProviders (): Promise<any> {
      return new Promise( ( resolve, reject ) => {
          const { client_id } = this.adobeIdData;

          this.imsApis.listSocialProviders( {
              client_id,
          } ).then( ( response: any ) => {
              resolve( response );
          } )
              .catch( ex => {
                  reject( ex );
              } )
      } );
  }

  /**
   *
   * @param token {string} represents the access token
   * @param expire {Date} the date when the token will expire
   */
  private tokenReceived ( tokenInfo: ITokenInformation ): void {
      const { handlers } = this.adobeIdData;

      handlers.triggerOnAccessToken( tokenInfo );

      TokenAutoRefresh.startAutoRefreshFlow( {
          expire: tokenInfo.expire,
          refreshTokenMethod: this.refreshToken,
      } );
  }

  /**
   * Retrieve the access token that satisfies the provided PBA policy, with a validity of at least [given] millis.
   * If the current access token in Storage satisfies the policy and is valid for at least the required time,
   * it will be returned.
   *
   * Otherwise, we will call the /check/token API with the pba_policy as parameter.
   *
   * The API will either return a token, if the current user session knobs satisfy the policy, or it will return a
   * PBA ride error, with a jump url, so the user performs the required actions for the session to become compliant
   * with the policy.
   *
   *
   * @param pbaPolicy - policy identifier (name)
   * @param validAtLeastMillis - value in millis. If the current token's expiry time is sooner than this, the token will
   * be considered unusable
   * @param contextToBePassedOnRedirect - in case a PBA ride error is thrown, this will be sent on the redirect back to
   * the lib
   * @param externalParameters - any other parameters to be sent to the check/token API
   */
  getTokenForPBAPolicy = ( pbaPolicy = '', validAtLeastMillis = 10000,
      contextToBePassedOnRedirect?: any, externalParameters: IDictionary = {} ): Promise<any> => {

      const tokenInfo = this.getAccessToken();

      // if this access token can be used, return it
      if ( tokenInfo &&
        Date.now() + validAtLeastMillis < tokenInfo.expire.getTime() &&
        ( !pbaPolicy ||  tokenInfo.pbaSatisfiedPolicies?.includes( pbaPolicy ) )
      ) {
          return Promise.resolve( tokenInfo );
      }

      // otherwise we need to call check token to obtain a new one
      const { adobeIdData, csrfService } = this;

      const nonce = csrfService.initialize();

      externalParameters.state = adobeIdData.createRedirectState( contextToBePassedOnRedirect, nonce );

      externalParameters.redirect_uri = RedirectHelper.createRedirectUrl(
          adobeIdData.redirect_uri,
          adobeIdData.client_id,
          externalParameters,
          "check_token",
          adobeIdData.scope
      )

      if ( pbaPolicy ) {
          externalParameters.pba_policy = pbaPolicy;
      }

      return this.refreshToken( externalParameters );
  }

  /**
   * Refresh the existing token.
   *
   * <uml>
   * start
   * :refreshToken;
   * :call backend: ims/check/v4/token?client_id;
   * :read the token and profile;
   * :triggerOnAccessToken;
   * if (profile) then (yes)
   * else (nothing)
   * :call backend to get the profile ;
   * endif
   * end
   * </uml>
   *
   * @param externalParameters {Object} external parameters sent from outside of the library
   * @param autoRefresh {boolean} undocumented flag signaling that the call was made from auto-refresh context. do not set!
   * Note: if refresh token API fails, the triggerOnAccessTokenHasExpired will be triggered
  */
  refreshToken = ( externalParameters: IDictionary = {}, autoRefresh = false ): Promise<any> => {
      // It is possible that the client app has better user activity detection (eg. frames)
      // in which case it may call refreshToken with userInactiveSince. If that is the case,
      // TokenAutoRefresh should be updated with the new data, to be used when auto-refreshing.
      if ( !autoRefresh && externalParameters.userInactiveSince ) {
          const userInactiveSince = externalParameters.userInactiveSince as number;
          const lastUserInteraction = Date.now() - userInactiveSince * 1000;
          if ( lastUserInteraction > TokenAutoRefresh.lastUserInteraction ) {
              TokenAutoRefresh.lastUserInteraction = lastUserInteraction;
          }
      }

      return this.tokenService.refreshToken( externalParameters )
          .then( ( tokenResponse: IRefreshTokenResponse ) => this.onTokenProfileReceived( tokenResponse ) )
          .catch( ex => {
              Log.error( 'refresh token error', ex );
              if( ex instanceof HttpErrorResponse ) {
                  return Promise.reject( ex );
              }

              const rideResult = this.verifyRideErrorExceptionStrict( ex );
              if ( rideResult ) {
                  return rideResult;
              }

              this.profileService.removeProfile();
              this.onTokenExpired();

              return Promise.reject( ex );
          } )

  }

  /**
   * retreive a new token and profile for the input user id
   * @param externalParameters {Object} external parameters sent from outside of the library
   * @param userId {String} represents the user id used to get the new token and profile
   */
  switchProfile = ( userId: string, externalParameters: IDictionary = {} ): Promise<any> => {

      if( !userId ) {
          return Promise.reject( new Error( 'Please provide the user id for switchProfile' ) );
      }

      return this.tokenService.switchProfile( userId, externalParameters )
          .then( ( tokenResponse: IRefreshTokenResponse ) => this.onTokenProfileReceived( tokenResponse ) )
          .catch( ex => this.verifyRideErrorException( ex ) )

  }

  /**
   * method used to process the token and profile
   * @param tokenResponse {IRefreshTokenResponse} represents the token and profile received from back-end
   */
  private onTokenProfileReceived ( tokenResponse: IRefreshTokenResponse ): Promise<IRefreshTokenResponse> {
      const { tokenInfo, profile } = tokenResponse;

      Log.info( 'token', tokenInfo );

      this.tokenReceived( tokenInfo );

      this.profileService.saveProfileToStorage( profile );

      return Promise.resolve( tokenResponse );
  }

  /**
   * @returns a promise which is resolved as true in case the token is valid otherwise false
   * validate the existing token;
   */
  validateToken (): Promise<boolean> {
      return this.tokenService.validateToken().then( () => {
          return Promise.resolve( true );
      } )
          .catch( ex => {
              Log.warn( 'validate token exception', ex );

              if( ex instanceof HttpErrorResponse ) {
                  return Promise.reject( false );
              }

              this.profileService.removeProfile();
              return Promise.reject( false );
          } )
  }

  /**
   * method used in case the existent token has expired
   */
  private onTokenExpired (): void {
      const { handlers } = this.adobeIdData;

      this.tokenService.purge();
      handlers.triggerOnAccessTokenHasExpired();
  }

  /**
   * set a new token into the local storage
   * @param tokenInfo {tokenInfo} represents the token/ expire information used by library
   */
  setStandAloneToken ( standaloneToken: StandaloneToken  ): boolean {
      return this.tokenService.setStandAloneToken( standaloneToken  );
  }

  /**
   * Method called on library initialization or page reloading
   * <uml>
   * start
   * :initialize method;
   * :get token;
   * if (fragment) then (yes)
   * :returns the token from fragment;
   * else (check local storage)
   * :returns the token from local storage;
   * endif
   * :if no token: return triggerOnAccessTokenHasExpired;
   * :triggerOnAccessToken;
   * :back-end: calls getProfile ;
   * :triggerOnReady ;
   * end
   * </uml>
   *
   * Note: this method is automatically called on every page reload;
  */
  initialize (): Promise<any> {

      const { handlers, standalone, ijt } = this.adobeIdData;
      let state: any = null;

      if( standalone ) {
          this.setStandAloneToken( standalone );
      }

      const initializationMethod = ijt ? this.exchangeIjt : this.tokenService.getTokenAndProfile;

      return initializationMethod()
          .then( this.processTokenResponse, this.processError.apply( this ) )
          .then( stateValue => {
              state = stateValue;
          } )
          .finally( () => {
              Log.info( 'onReady initialization' );
              window.addEventListener( ASK_FOR_IMSLIB_INSTANCE_DOM_EVENT_NAME,  () => {
                  this.triggerOnImsInstance( this );
              }, false );

              handlers.triggerOnReady( state ? state.context : null );
              this.triggerOnImsInstance( this );
              this.initialized = true;
          } );
  }

  private processError (): ( ex: any ) => Promise<any> {
      return ex => this.verifyModalSignInEvent ( ex )
          .catch( this.processInitializeException )
          .catch( this.verifyTokenExpiredException )
          .catch( this.verifyRideErrorException )
          .catch( this.verifyCsrfException )
          .catch( this.executeErrorCallback )
  }

  private executeErrorCallback = ( ex: any ): void => {
      Log.info( 'initialize exception ended', ex )
      const { onError } = this.adobeIdData
      onError && onError( IErrorType.HTTP, 'Initialization error' )
  }

  /**
   *
   * @param instance { AdobeIMS } instance of AdobeIMS
   */
  private triggerOnImsInstance = ( instance: AdobeIMS ): void => {
      const evt = document.createEvent( "CustomEvent" );
      const evtData = {
          clientId: this.adobeIdData.client_id,
          instance,
      };
      evt.initCustomEvent( ON_IMSLIB_INSTANCE, false, false, evtData );
      window.dispatchEvent( evt );
  }

  /**
     * process the initialize exception;
     * this method is the first method called in case there was an error during initialize flow;
     * check if the exception type is TokenExpiredException and pass the flow to the verifyCsrfException
     * @param initializeException represent the exception received during the initialize
     */
  private processInitializeException = ( initializeException = {} ): Promise<any> => {
      Log.warn( 'initialize', initializeException );
      this.restoreHash();
      return Promise.reject( initializeException );
  }
  
  private verifyModalSignInEvent = ( ex: any ): Promise<any> => {
      if ( ex instanceof ModalSignInEvent ) {
          // this happens when popup window redirects and the state from fragment contains imslibmodal property as true
          return this.notifyParentAboutModalSignIn( ex );
      }
      return Promise.reject( ex );
  }

  private verifyTokenExpiredException = ( ex: any ): Promise<any> => {
      if ( ex instanceof TokenExpiredException ) {
          this.adobeIdData.handlers.triggerOnAccessTokenHasExpired();
          return Promise.resolve();
      } else {
          return Promise.reject( ex );
      }
  }

  /**
   * pass the redirect url from the popup window to parent
   * @param modalSignInEvent {ModalSignInEvent} represents the redirect url after user has signed in
   */
  private notifyParentAboutModalSignIn ( modalSignInEvent: ModalSignInEvent ): Promise<string> {
      const href = window.location.href.replace( 'imslibmodal', 'wasmodal' );

      if ( window.opener ) {
          window.opener.postMessage( href, window.location.origin );
          window.close();
      } else {
          const broadcastChannel = new BroadcastChannel( "imslib" )
          broadcastChannel.postMessage( href );
          broadcastChannel.close()
          window.close();
      }

      return Promise.reject( 'popup' );
  }


  /**
   * method called in case of exception on initialize.
   * if error is RideError, it redirects to the jump url from RideException.jump.
   * @return a rejected promise with the given ex
   */
  private verifyRideErrorException = async ( ex: any ): Promise<any> => {
      if ( ex instanceof RideException ) {
          if( !!this.adobeIdData.overrideErrorHandler &&
            !this.adobeIdData.overrideErrorHandler( ex ) ) {
              return Promise.reject( ex );
          }
          if ( ex.isPbaExpiredIdleSessionWorkaround ) {
              await this.signIn();
          } else if ( ex.jump ) {
              await UrlHelper.replaceUrlAndWait( ex.jump, 10000 );
          }
      }

      return Promise.reject( ex );
  }

    /**
     * Same as verifyRideErrorExceptionStrict, but returns null if ex is not RideException
     */
    private verifyRideErrorExceptionStrict = ( ex: any ): Promise<any> | null => {
        if ( !( ex instanceof RideException ) ) {
            return null;
        }

        return this.verifyRideErrorException( ex );
    }

  /**
   * method called in case of exception on initialize.  if error type is CSRF, it calls the signOut methods
   */
  private verifyCsrfException = ( ex: any ): Promise<any> => {
      const { type: errorType } = ex;
      if ( errorType && errorType === IErrorType.CSRF ) {
          this.signOut();
      }
      return Promise.reject( ex );
  }

  /**
   * method called after a successful call to the getTokenAndProfile method in order to process the token response
   * tokenProfile: TokenProfileResponse - contains the token fields and eventually the user profile
   * @returns Promise
   */
  private processTokenResponse = ( tokenProfile: TokenProfileResponse ): Promise<any> => {
      const { handlers } = this.adobeIdData;

      const { tokenFields, profile } = tokenProfile;
      const { tokenValue: token, state, expire, sid, user_id: userId, other = {}, impersonatorId, isImpersonatedSession, pbaSatisfiedPolicies } = tokenFields;
      Log.info( 'token', token );

      if( other.from_ims ) {
          UrlHelper.setHash( other.old_hash || '' );
      }

      this.profileService.removeProfileIfOtherUser( userId );

      const notificationData =  { token, expire, sid, impersonatorId, isImpersonatedSession, pbaSatisfiedPolicies };

      tokenFields.isReauth() ? handlers.triggerOnReauthAccessToken( notificationData ) : this.tokenReceived( notificationData );
      if( profile ) {
          this.profileService.saveProfileToStorage( profile );
      }

      return Promise.resolve( state );
  }


  /**
   * restore the window hash value to the initial one
   */
  private restoreHash (): void {
      const fragmentValues = FragmentHelper.fragmentToObject();
      if( !fragmentValues || !fragmentValues.from_ims ) {
          return;
      }

      UrlHelper.setHash( fragmentValues.old_hash as string || '' );
  }

  /**
   * Exchange the user's access_token for a Transitory Access Code (TAC) for target client and scope
   * @see {@link https://wiki.corp.adobe.com/display/ims/Transitory+Authorization+Codes |Transitory Authorization Codes}
   * @param tacRequest {ITransitoryAuthorizationRequest}
   * @param externalParameters {IDictionary} object used in order to update the default api values
   */
  getTransitoryAuthorizationCode ( tacRequest: ITransitoryAuthorizationRequest, externalParameters: IDictionary = {} ): Promise<ITransitoryAuthorizationResponse> {

      tacRequest = tacRequest || {};

      tacRequest.response_type = tacRequest.response_type || 'code';
      tacRequest.target_client_id = tacRequest.target_client_id || this.adobeIdData.client_id;
      tacRequest.target_scope = tacRequest.target_scope || this.adobeIdData.scope;

      return this.imsApis.getTransitoryAuthorizationCode( tacRequest, externalParameters, this.adobeIdData.client_id );
  }

  /**
   * method used during initialization in order to get a ijt token
   * https://wiki.corp.adobe.com/display/ims/Implicit+Jump+Tokens
   * @returns {Promise<any>} ijt response
   * @param {string} ijt value used for token excahnge (other than the one from adobeid)
   * @usage adobeIMS.adobeIdData.ijt = 'ijtValue' followed by adobeIMS.initialize()
   */
  private exchangeIjt = ( ijt?: string ): Promise<TokenProfileResponse> => {
      const { ijt: adobeIjt } = this.adobeIdData;
      if( !ijt && !adobeIjt ) {
          return Promise.reject( new Error( 'please set the adobeid.ijt value' ) );
      }
      return this.tokenService.exchangeIjt( ijt || adobeIjt as string ).then( ( resp: TokenProfileResponse ) => {
          if( resp.profile ) {
              this.profileService.saveProfileToStorage( resp.profile );
          } else {
              this.profileService.removeProfile();
          }
          return Promise.resolve( resp );
      } )
  }

  /**
   * Allows a client to launch a system-browser and arrive at another IMS-integrated application
   * https://wiki.corp.adobe.com/pages/viewpage.action?spaceKey=ims&title=IMS+API+-+jumptoken
   * @param jumpTokenRequest {IJumpTokenRequest}
   * @param externalParameters {object} object used to override the default request values
   * @returns IJumpTokenResponse
   */
  jumpToken ( jumpTokenRequest: IJumpTokenRequest, externalParameters: IDictionary = {} ): Promise<IJumpTokenResponse> {

      jumpTokenRequest.target_client_id = jumpTokenRequest.target_client_id || this.adobeIdData.client_id;
      jumpTokenRequest.target_scope = jumpTokenRequest.target_scope || this.adobeIdData.scope;

      return this.imsApis.jumpToken( jumpTokenRequest, externalParameters, this.adobeIdData.client_id );
  }

  getVerifierByKey ( nonce: string ): string {
      return new CodeChallenge().getVerifierByKey( nonce );
  }

  /**
   * The purpose is to sign in with a social account without navigating outside the page (i.e. via Ajax calls only)
   * @see {@link https://wiki.corp.adobe.com/pages/viewpage.action?pageId=1106020498} Social Headless API
   * @param socialHeadlessSignInRequest {ISocialHeadlessSignInRequest} containing the social provider and the token obtained
   * @param externalParameters {object} object used to override the default request values
   * @returns TokenProfileResponse with the response from the IJT exchange
   * Will initiate a signIn flow if the response is a ride error of type 'ride_AdobeID_social`
   */
  async socialHeadlessSignIn ( socialHeadlessSignInRequest: ISocialHeadlessSignInRequest, externalParameters: IDictionary={} ): Promise<TokenProfileResponse> {
      return this.imsApis.socialHeadlessSignIn( socialHeadlessSignInRequest, externalParameters ).then(
          ijtResponse=>
              this.exchangeIjt( ijtResponse.token )
      ).catch( err => {
          if( err.error === 'ride_AdobeID_social' ) {
              this.signIn( {
                  idp_flow: 'social.native',
                  provider_id: socialHeadlessSignInRequest.provider_id,
                  idp_token: socialHeadlessSignInRequest.idp_token } );
          }
          return Promise.reject( err );
      } );
  }
}

