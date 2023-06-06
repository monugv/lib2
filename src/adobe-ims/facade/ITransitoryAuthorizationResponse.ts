
/**
 * interface used to present the transitory authorization response values
 * 
 */
export interface ITransitoryAuthorizationResponse {

    /**
     * token value; 
     */
    access_token: string;

    /**
     * contains the authorization code
     */
    code: string;

    /**
     * token type
     */
    token_type: string;

    /**
     * code expiration value
     */
    expires_in: number;

}