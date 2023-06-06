import { OnAccessTokenFunction, OnAccessTokenHasExpiredFunction, OnErrorFunction, OverrideErrorFunction } from './custom-types/CustomTypes';
import { StandaloneToken } from '../token/StandaloneToken';
import { IAdobeIdThinData } from './IAdobeIdThinData';

export interface IAdobeIdData extends IAdobeIdThinData{
  
  /**
   * if true, the token will be validated against validate token api 
   */
  autoValidateToken? : boolean | undefined;

  /**
   * The token use by ims library
   */
  standalone?: StandaloneToken | undefined;

  /**
   * Handler used for access token notification
   */
  onAccessToken: OnAccessTokenFunction | null;

  /**
   * handler used for token expiration notifications
   */
  onAccessTokenHasExpired: OnAccessTokenHasExpiredFunction | null;

  /**
   * handler used for token reauth notifications
   */
  onReauthAccessToken: OnAccessTokenFunction | null;

  /**
   * handler used to notify about any errors
   */
  onError: OnErrorFunction | null;


  overrideErrorHandler?: OverrideErrorFunction;
  

}