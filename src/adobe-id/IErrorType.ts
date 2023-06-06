
/**
 * Enumeration values used for ims error types
 */
/**
 * Enumeration values used for ims error types
 */
export enum IErrorType {
  /**
   * error triggered in case of exception on adobe ims initialize
   */
  INITIALIZE_ERROR = 'initialize_error',
  /**
   * http exception type
   */
  HTTP = 'http',
  /**
   * fragment exception type
   */
  FRAGMENT = 'fragment',
  /**
   * csrf exception type
   */
  CSRF = 'csrf',
  /**
   * error triggered when get token method is called using a different api than the ones allowed
   */
  NOT_ALLOWED = 'not_allowed',
  /**
   * exception triggered when the profile api throws exception
   */
  PROFILE_EXCEPTION = 'profile_exception',

  /**
   * token expired error
   */
  TOKEN_EXPIRED = 'token_expired',

  /**
    * social providers error type
    */
  SOCIAL_PROVIDERS = 'SOCIAL_PROVIDERS',

  /**
  * ride exception sent to the client in case ther is no jump
  */
  RIDE_EXCEPTION = 'ride_exception',

}
