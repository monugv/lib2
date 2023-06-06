
/**
 * interface used to store the jumptoken api response
 * 
 */
export interface IJumpTokenResponse {

    /**
     * The redirect URL, which contains the continuation token. For example:
     * {"jump":"https://ims-na1-qa1.adobelogin.com/ims/jump/CONTINUATION_TOKEN"}
     */
   jump: string;
}