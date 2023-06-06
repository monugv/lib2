
/**
 * interface used to store the parameters used by TokenAutoRefresh class
 */

export interface ITokenAutoRefreshParams {
    /**
     * token expiration date
     */
    expire: Date;

    /**
     * refresh method from ImsLib instance
     */
    refreshTokenMethod: Function;

}