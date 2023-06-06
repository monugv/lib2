

enum JumpTargetResponseType {
  code = 'code',
  token = 'token',
  device = 'device'
}
/**
 * model used for jumptoken method
 * 
 */
export interface IJumpTokenRequest {

    /**
     * The user's access token for the application. For additional information, see IMS Service Tokens.
     * https://wiki.corp.adobe.com/display/ims/Service+Tokens 
     */
     bearer_token: string;

     /**
      * target client id
      */
    target_client_id: string;

    /**
     * Optional. The URL to which to direct the user's browser on completion of the operation
     */
    target_redirect_uri?  : string;

    /**
     * scope used for transitory authorization
     */
    target_scope?  : string;
    
    /**
     * Optional. The IMS integration type of the target. The default is code.
     */
    target_response_type?: JumpTargetResponseType;

    locale?: string;

    
}