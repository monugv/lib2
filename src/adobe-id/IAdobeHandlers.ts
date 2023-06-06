import { OnAccessTokenFunction, OnAccessTokenHasExpiredFunction, OnErrorFunction } from "./custom-types/CustomTypes";
import { OnReadyFunction } from "./custom-types/CustomThinTypes";



/**
 * Interface used by AdobeIdData to trigger adobeid functions
 */
export interface IAdobeHandlers {

      /**
       * Event triggered when a new access token is aquired
       */
      triggerOnAccessToken: OnAccessTokenFunction;

      /**
       * Event triggered when a reauth token has aquired
       */
      triggerOnReauthAccessToken: OnAccessTokenFunction;

      /**
       * Event triggered when an access token is invalid;
       * NOTE: the developers should consider that the access token is not available; Same as triggerOnAccessToken(null)
       */
      triggerOnAccessTokenHasExpired: OnAccessTokenHasExpiredFunction;

      /**
       * Event triggered when the ims library is fully intialized
       */
      triggerOnReady: OnReadyFunction;

      /**
       * Event trigered when an unexpected error occured in imslib
       */
      triggerOnError: OnErrorFunction;
      
}
