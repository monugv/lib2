

/**
 * Interface for analytics values
 */
export interface IAnalytics {
  /**
  * represents the application code value;
  * this value (if exists) will be sent to the server.
  */
  appCode: string | null;

  /**
   * represents the application version value;
   * this value (if exists) will be sent to the server.
   */
  appVersion?: string | null;

}