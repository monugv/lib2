import { IDictionary } from '../facade/IDictionary';
import { OnReadyFunction, RideRedirectUri } from './custom-types/CustomThinTypes';
import { OverrideErrorFunction } from './custom-types/CustomTypes';
import { IAnalytics } from './IAnalytics';
import { IEnvironment } from './IEnvironment';

export interface IAdobeIdThinData {
  /**
   {Object.<string, Object>} [api_parameters] - An object containing various custom parameters for IMS
  */
  api_parameters?: IDictionary | undefined;

  client_id: string;
  /**
   * The scopes used to acquire access tokens
   */
  scope: string;
  /**
    will default to `en_US` if none is set
  */
  locale: string;

  /**
   * environment value provided to adobeIdData;
   * if not provided, the production will be used;
   * if 'stg1', the stage environment is used
   */
  environment: IEnvironment;

  /**
   * The redirect uri value is used for signin, signout operations and the used value is the one from external parameters or adobe id data or window.location.href
   */
  redirect_uri?: string | ( () => string ) | undefined;

  /**
   * use the local storage for token management; default value (if not defined is false)
   */
  useLocalStorage?: boolean | undefined;

  /**
   * if true, the logging mechanism is enabled
   */
  logsEnabled?: boolean | undefined;

  /**
   * ijt value used for ijt flow
   */
  ijt? : string;

  /**
   * represents the object used to encapsulate the analytics parameters
   */
  analytics? : IAnalytics;

  /**
   * handler used to notify that the library is initialized;
   *
   */
  onReady: OnReadyFunction | null;

  /**
   * the redirect uri value to be used for ride jumps. must match the client redirect patterns.
   * can be undefined - uses the current url,
   * a string - either a static URL or "DEFAULT", meaning the client default redirect uri,
   * a function that receives the ride code and jump and returns the redirect uri string.
   */
  rideRedirectUri?: RideRedirectUri;


  /**
   * @function {adoveid.overrideErrorFunction}
   * Function used to override the normal ride error handling that involves a redirect
   * The function receives the error as an argument
   * If the function returns true, then normal handling is resumed, otherwise it is skipped
   */
   overrideErrorHandler?: OverrideErrorFunction;

  /**
   * Controls which /check/token endpoint is called by imslib2.js. Only has an effect
   * if the browser address URL is on one of the proxied domains.
   */
  proxiedCheckToken?: boolean;
}
