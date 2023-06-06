
/**
 * interface used to pass the requested values to getTransitoryAuthorizationCode method
 * 
 */
export interface ITransitoryAuthorizationRequest {

    /**
     * token 
     */
    target_client_id: string;

    /**
     * authorization code
     */
    response_type: string;

    /**
     * scope used for transitory authorization
     */
    target_scope: string;

    

    
}