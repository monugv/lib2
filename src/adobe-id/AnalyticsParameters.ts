
/**
 * class used to store the analytics parameters
 */

import { IAnalytics } from "./IAnalytics";

export class AnalyticsParameters implements IAnalytics {

    /**
    * represents the application code value;
    * this value (if exists) will be sent to the server.
    */
    appCode = '';

    /**
     * represents the application version value;
     * this value (if exists) will be sent to the server.
     */
    appVersion= '';
}

