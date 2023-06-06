import { IDictionary } from "./../facade/IDictionary";
import { IAdobeIdData } from "./IAdobeIdData";
import { IAdobeHandlers } from "./IAdobeHandlers";
import { IRedirectRequest } from "../adobe-ims/facade/IRedirectRequest";
import { AdobeIdKey } from "../constants/ImsConstants";
import { IErrorType } from "./IErrorType";
import { PopupSettings } from '../adobe-ims/sign-in/PopupSettings';
import {
    OnAccessTokenFunction,
    OnAccessTokenHasExpiredFunction,
    OnErrorFunction,
    ITokenInformation,
} from "./custom-types/CustomTypes";
import { StandaloneToken } from "../token/StandaloneToken";
import { IReauth } from "../adobe-ims/facade/IReauth";
import { IGrantTypes } from "../adobe-ims/facade/IGrantTypes";
import { AdobeIdThinData } from "./AdobeIdThinData";


/**
 *  Class used to store the adobe data values.
 *
 *  Ims library will use these values for all operations
 */
export class AdobeIdData extends AdobeIdThinData implements IAdobeIdData {

  /**
   * if true, the token will be validated against validate token api 
   */
  autoValidateToken? : boolean | undefined;

  /**
   * The token use by ims library
   */
  standalone: StandaloneToken | undefined;

  /**
   * modal settings used for sign in with modal
   */
  modalSettings: PopupSettings;

  modalMode?: boolean; 

  /** @function {adobeid.onAccessTokenHasExpired} onAccessTokenHasExpired
   *  Function to be executed if the 'access_token' is invalid.
   */
  onAccessTokenHasExpired: OnAccessTokenHasExpiredFunction | null = null;

  /**  @function {adobeid.onAccessToken} - Function to be executed once imslib.js has acquired
   * an `access_token`.
   */
  onAccessToken: OnAccessTokenFunction | null = null;

  /**
   * @function {adobeid.onReauthAccessToken} Function used to trigger the reauth access token
   */
  onReauthAccessToken: OnAccessTokenFunction | null = null;

  /**
   * @function {adobeid.onError}
   * Function used to notify external libraries for ims errors
   */
  onError: OnErrorFunction | null = null;

  /**
   * @constructor Create the adobeIdData object with all necessary properties from adobeData input paramater
   *
   * It uses the input adobeData parameter or the object stored in window.adobeid
   */
  constructor ( adobeData: IAdobeIdData | null = null ) {
      super( adobeData );
      const adobeid = adobeData ? adobeData : window[AdobeIdKey];
      if ( !adobeid || !adobeid.client_id ) {
          throw new Error( "Please provide required adobeId, client_id information" );
      }

      const {
          standalone,
          autoValidateToken,
          modalSettings = {},
          modalMode = false,
          onAccessToken,
          onReauthAccessToken,
          onAccessTokenHasExpired,
          onReady,
          onError,
          overrideErrorHandler,
          onModalModeSignInComplete
      } = adobeid;

      if ( standalone && standalone.token ) {
          this.standalone = new StandaloneToken( standalone );
      }
      this.modalSettings = new PopupSettings( modalSettings );
      this.modalMode = modalMode;
      
      this.autoValidateToken = !!autoValidateToken;
    
      this.onAccessToken = onAccessToken ? onAccessToken : null;
      this.onReauthAccessToken = onReauthAccessToken ? onReauthAccessToken : null;
      this.onAccessTokenHasExpired = onAccessTokenHasExpired
          ? onAccessTokenHasExpired
          : null;
      this.onReady = onReady ? onReady : null;
      this.onError = onError ? onError : null;
      this.overrideErrorHandler = overrideErrorHandler;
      this.onModalModeSignInComplete = onModalModeSignInComplete;
  }

  /**
   * Handlers object is used to invoke the adobe id data events.
   *
   * When a token, profile is aquired, or token is expired and library is fully intialized, an event is triggered
   */
  handlers: IAdobeHandlers = {
      triggerOnAccessToken: ( data: ITokenInformation ): void => {
          this.onAccessToken && this.onAccessToken( data );
      },
      triggerOnReauthAccessToken: ( data: ITokenInformation ): void => {
          this.onReauthAccessToken && this.onReauthAccessToken( data );
      },
      triggerOnAccessTokenHasExpired: (): void => {
          this.onAccessTokenHasExpired && this.onAccessTokenHasExpired();
      },
      triggerOnReady: ( context: any = null ): void => {
          this.onReady && this.onReady( context );
      },
      triggerOnError: ( errorType: IErrorType, error: any ) => {
          this.onError && this.onError( errorType, error );
      }
  };

  /**
   * Function used by IMSLib to use only the neccesarry properties from AdobeIdData for social provider
   * @param providerName provider name used for sign in
   * @param requestedParameters {Object} the external parameters used for signin and reauth methods
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   */
  createSocialProviderRedirectRequest (
      providerName: string,
      requestedParameters: IDictionary,
      contextToBePassedOnRedirect: any,
      nonce: string,
      grantType: IGrantTypes = IGrantTypes.token
  ): Promise<IRedirectRequest> {
      const params = {
          idp_flow: "social.deep_link.web",
          provider_id: providerName,
      };

      const signInParams = {
          ...requestedParameters,
          ...params,
      };

      return this.createRedirectRequest(
          signInParams,
          contextToBePassedOnRedirect,
          nonce,
          grantType,
      );
  }

  /**
   * Function used by ims to use only the neccesarry properties from AdobeIdData on sign in and reauth methods
   * @param requestedParameters {Object} the external parameters used for signin and reauth methods
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   * @param nonce {string} - string representing the nonce value used for CSRF
   * @param reauth {string}; represents the re authenticate value. available values are: check and force. default value is "check"
   */
  createReAuthenticateRedirectRequest (
      requestedParameters: IDictionary,
      contextToBePassedOnRedirect: any,
      nonce: string,
      reauth = IReauth.check,
      grantType: IGrantTypes = IGrantTypes.token,
  ): Promise<IRedirectRequest> {
      const params = {
          reauth,
      };

      const reauthParams = {
          ...requestedParameters,
          ...params,
      };

      return this.createRedirectRequest(
          reauthParams,
          contextToBePassedOnRedirect,
          nonce,
          grantType,
      );
  }

  /**
   * Function used by ims to use only the neccesarry properties from AdobeIdData on sign in and reauth methods
   * @param requestedParameters {Object} the external parameters used for signin and reauth methods
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   */
  createSignUpRedirectRequest (
      requestedParameters: IDictionary,
      contextToBePassedOnRedirect: any,
      nonce: string,
      grantType: IGrantTypes = IGrantTypes.token
  ): Promise<IRedirectRequest> {
      const signupParams = {
          ...requestedParameters,
          idp_flow: "create_account",
      };

      return this.createRedirectRequest(
          signupParams,
          contextToBePassedOnRedirect,
          nonce,
          grantType
      );
  }

}
