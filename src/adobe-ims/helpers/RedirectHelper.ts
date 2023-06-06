import { IDictionary } from "../../facade/IDictionary";
import ApiHelpers from "../../api-helpers/ApiHelpers";
import { merge } from "../../util/ObjectUtil";

export class RedirectHelper {
    /**
    * returns the initial redirect url; the priority value is redirect_uri from external parameters, adobeId and finally the href value from browsers  
    * @param externalParameters 
    * @param adobeIdRedirectUri 
    */
    static getInitialRedirectUri ( externalParameters: IDictionary, adobeIdRedirectUri: string | ( () => string ) | undefined ): string {
        
        const redirectParam = externalParameters["redirect_uri"] ||  adobeIdRedirectUri || window.location.href;

        const redirectValue: string = typeof redirectParam === 'function'? redirectParam() : redirectParam;
        
        let fromImsIndex = redirectValue.indexOf( 'from_ims' );
        if( fromImsIndex === -1 ) {
            return redirectValue;
        }

        if( redirectValue[fromImsIndex-1] ==='#' ) {
            fromImsIndex--;
        }

        return redirectValue.substr( 0, fromImsIndex );

    }

    /**
    * create the return url which it will be passed to authorize or logout endpoint
    * @param adobeIdRedirectUri {string} - represents the redirect_uri? set on AdobeId;
    * @param clientId {string} - represents the client id from AdobeId
    * @param externalParameters {Object} external parameters passed to library
    * @param apiName {string} api name
    * 
    * @returns {string} final redirect url used for sign-in or reauth (authorize) or logout
    */
    static createDefaultRedirectUrl ( adobeIdRedirectUri: string | ( () => string ), clientId: string, externalParameters: IDictionary, apiName: string ): string {

        const initialRedirectUri = this.getInitialRedirectUri( externalParameters, adobeIdRedirectUri );
        //encode the hash in case that exists
        const redirectUri = this.createOldHash( initialRedirectUri );

        return redirectUri.indexOf( '?' ) > 0 ? 
            `${ redirectUri }&client_id=${ clientId }&api=${ apiName }` :
            `${ redirectUri }?client_id=${ clientId }&api=${ apiName }` 
    }

    /**
     * <uml>
     * start
     * :CreateDefaultRedirectUrl ;
     * :merge api parameters with external parameters
     * :encode the merged parameters and call the /ims/authorize/v1/${encodedParameters} url
     * end
     * </uml>
     * 
     * create the return url which it will be passed to authorization endpoint
     * @param redirectUri {string} - represents the base url href value
     * @param clientId {string} - represents the client id
     * @param externalParameters {Object} external parameters passed to library
     * @param apiName {string} api name
     * @parm scope {string} scope of sign in
     * @returns {string} final redirect url used for sign in
     */
    static createRedirectUrl ( adobeIdRedirectUri: string | ( () => string ), clientId: string, externalParameters: IDictionary, apiName: string, scope = '' ): string {

        let redirectUri = this.createDefaultRedirectUrl( adobeIdRedirectUri, clientId, externalParameters, apiName );

        scope = scope || externalParameters["scope"] as string || '';

        if ( scope ) {
            redirectUri = `${ redirectUri }&scope=${ scope }`;
        }

        const reauth = externalParameters["reauth"] as string || '';
        if ( reauth ) {
            redirectUri = `${ redirectUri }&reauth=${ reauth }`;
        }

        return redirectUri;
    }

    /**
     * @param source {string} represent the url value
     * @returns {string} the url with hash
     */
    static createOldHash ( source: string ): string {
        const index = source.indexOf( "#" );
        if ( index < 0 ) {
            return `${ source }#old_hash=&from_ims=true`;
        }
        const baseUrl = source.substring( 0, index );
        const hash = source.substring( index + 1 );

        return `${ baseUrl }#old_hash=${hash}&from_ims=true`;
    }

    static mergeApiParamsWithExternalParams ( apiParameters: IDictionary, externalParameters: IDictionary, apiName: string ): IDictionary {
        return merge( ApiHelpers.getCustomApiParameters( apiParameters, apiName ), externalParameters );
    }

}
