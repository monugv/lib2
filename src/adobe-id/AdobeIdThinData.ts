import { IDictionary } from "../facade/IDictionary";
import { IAdobeIdThinData } from "./IAdobeIdThinData";
import { IRedirectRequest } from "../adobe-ims/facade/IRedirectRequest";
import { AdobeIdKey, DEFAULT_LANGUAGE } from "../constants/ImsConstants";
import { IEnvironment } from "./IEnvironment";
import Environment from "../adobe-ims/environment/Environment";
import { AnalyticsParameters } from "./AnalyticsParameters";

import Log from "../log/Log";
import { IReauth } from "../adobe-ims/facade/IReauth";
import { IGrantTypes } from "../adobe-ims/facade/IGrantTypes";
import { OnReadyFunction, RideRedirectUri } from "./custom-types/CustomThinTypes";
import { CodeChallenge } from "../adobe-ims/pkce/code-challenge";
import { ICodeChallenge } from "./ICodeChallenge";
import { ModalSignInCallbackFunction, OverrideErrorFunction } from "./custom-types/CustomTypes";

/**
 *  Class used to store the adobe data values.
 *
 *  Ims library will use these values for all operations
 */
export class AdobeIdThinData implements IAdobeIdThinData {

  /**
   * represents the class used to store the analytics parameters
   */
  analyticsParameters: AnalyticsParameters = new AnalyticsParameters();

  /**
    @property Object containing various custom parameters for IMS.
    This object is used in case a custom API parameter is desired to be sent to the back-end.

    E.G. { logout: 'your_custom_value' }

    The list of api's which can be customized are: authorize, validate_token, profile, userinfo, logout, logout_token, check, providers, ijt
  */
  api_parameters? = {};

  /**
    @property {string} Localization value used by ims library.

    Default value is `en_US`
  */
  locale = "";

  /**
   * @property {string} - The scopes used to acquire access tokens. A comma separated list of client scopes.
   * No whitespace.
   * Default scopes: AdobeID
   */
  scope = "AdobeID";

  /**
   * @property {string} - The client id used by ims library
   */
  client_id = "";

  /**
   * represents the used environment; default is prod and in case the value is stg1, the stage environment is used
   */
  environment: IEnvironment = IEnvironment.PROD;

  /**
   *  use the local storage for token management; default value is false;
   */
  useLocalStorage = false;

  /**
   * @property {string} Used as redirect url
   *
   * The redirect uri value is used for signin, signout operations and the used value is the one from external parameters or adobe id data or window.location.href
   */
  redirect_uri: string | ( () => string );

  /** @function {adobeid.onReady} [onReady] - Function to be executed once imslib.js has been fully
   * initialized.
   */
  onReady: OnReadyFunction | null = null;

  overrideErrorHandler?: OverrideErrorFunction;

  ijt?: string | undefined;

  rideRedirectUri?: RideRedirectUri;

  onModalModeSignInComplete: ModalSignInCallbackFunction | null = null;

  proxiedCheckToken = false;

  /**
   * @constructor Create the adobeIdData object with all necessary properties from adobeData input paramater
   *
   * It uses the input adobeData parameter or the object stored in window.adobeid
   */
  constructor ( adobeData: IAdobeIdThinData | null = null ) {
      const adobeid = adobeData ? adobeData : window[AdobeIdKey];
      if ( !adobeid || !adobeid.client_id ) {
          throw new Error( "Please provide required adobeId, client_id information" );
      }

      const {
          api_parameters,
          client_id,
          locale,
          scope,
          ijt,
          environment = IEnvironment.PROD,
          redirect_uri,
          useLocalStorage,
          logsEnabled,
          onReady,
          rideRedirectUri,
          proxiedCheckToken,
      } = adobeid;

      this.environment = environment;
      this.api_parameters = api_parameters ? api_parameters : {};
      this.client_id = client_id;
      this.locale = locale || DEFAULT_LANGUAGE;
      this.scope = scope ? scope.replace( /\s/gi, '' ): '';
      this.redirect_uri = redirect_uri;
      this.ijt = ijt;

      this.useLocalStorage = useLocalStorage;
      if ( logsEnabled ) {
          Log.enableLogging();
      } else {
          Log.disableLogging();
      }

      this.onReady = onReady ? onReady : null;
      this.rideRedirectUri = rideRedirectUri;

      this.proxiedCheckToken = proxiedCheckToken;

      this.fillAnalyticsParameters( adobeid );

      Environment.loadEnvironment( environment, proxiedCheckToken, window.location.hostname );
  }

  /**
   * fill the analytic parameters with the values provided by adobeid data
   * @param adobeid represents the adobeid data provided to library
   */
  private fillAnalyticsParameters ( adobeid: any ): void {
      const { analytics: { appCode = "", appVersion = "" } = {} } = adobeid;

      const { analyticsParameters } = this;

      analyticsParameters.appCode = appCode;
      analyticsParameters.appVersion = appVersion;
  }

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
      grantType: IGrantTypes,
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
          grantType
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
      grantType: IGrantTypes = IGrantTypes.token
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
      nonce: string
  ): Promise<IRedirectRequest> {
      const signupParams = {
          ...requestedParameters,
          idp_flow: "create_account",
      };

      return this.createRedirectRequest(
          signupParams,
          contextToBePassedOnRedirect,
          nonce,
          IGrantTypes.token
      );
  }

  /**
   * Function used by ims to use only the neccesarry properties from AdobeIdData on sign in and reauth methods
   * @param externalParameters {Object} the external parameters used for signin and reauth methods
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   * @param nonce {string} - string representing the nonce value used for CSRF
   * @param grantType {IGrantTypes} represents the grant type used for sign in flow
   */
  createRedirectRequest ( externalParameters: IDictionary, contextToBePassedOnRedirect: any, nonce: string,  grantType: IGrantTypes ): Promise<IRedirectRequest> {

      const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri = '', scope, locale } = this;

      const state = this.createRedirectState( contextToBePassedOnRedirect, nonce );

      const redirectRequest: IRedirectRequest = {
          adobeIdRedirectUri,
          apiParameters,
          clientId,
          externalParameters,
          scope,
          locale,
          response_type: grantType,
          state,
      };

      if( grantType === IGrantTypes.token ) {
          return Promise.resolve( redirectRequest );
      }

      const codeChallenge = new CodeChallenge();
      return codeChallenge.createCodeChallenge( nonce ).then( ( challengeResponse: ICodeChallenge ) => {
          externalParameters.code_challenge = challengeResponse.challenge;
          externalParameters.code_challenge_method = 'S256';

          const codeState = this.createRedirectState( contextToBePassedOnRedirect, nonce );

          redirectRequest.state = codeState;

          return Promise.resolve( redirectRequest );
      } )
  }

  /**
   * create the stae object used during redirect; if the adobeid.context is empty and no analytics parameters, the state will ne null
   * @param context represents the external parameters
   */
  createRedirectState ( context: any, nonce: string ): any {
      const {
          analyticsParameters: { appCode = "", appVersion = "" },
      } = this;

      const state: any =
      context === undefined
          ? {}
          : {
              context,
          };

      if ( appCode ) {
          state["ac"] = appCode;
      }

      if ( appVersion ) {
          state["av"] = appVersion;
      }

      state["jslibver"] = Environment.jslibver;
      state["nonce"] = nonce;

      return Object.keys( state ).length ? state : null;
  }

  triggerOnReady (): void {
      this.onReady && this.onReady( undefined );
  }

  computeRideRedirectUri ( code: string ): string | null {
      if ( !this.rideRedirectUri ) {
          return window.location.href;
      }
      if ( typeof this.rideRedirectUri === "string" ) {
          return this.rideRedirectUri === "DEFAULT" ? null : this.rideRedirectUri;
      }

      return this.rideRedirectUri( code );
  }

}
