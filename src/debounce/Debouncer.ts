
/**
 * class used for caching the api calls for a second. 
 * The flow is:
 * 1. make api call from ImsLib
 * 2. if the Debouncer cache already contains a response for that api/parameters -> return the cashed response
 * 
 */

import { ApiResponse } from '../ims-apis/xhr/ApiResponse';
class Debouncer {

    /**
     * debounce time value; one second
     */
    private DEBOUNCE_TIME = 1000;

    /**
     * dictionary with all executed methods for the last second
     */
    private cache = {};

    /**
     * starts to execute a specific API. if there is a cached response, it will be returned 
     * @param url - api url
     * @param parameters - represents the parameters used to call the api
     */
    getCachedApiResponse ( url: string, parameters = '' ): any | null {
        const hash = typeof parameters === 'string' ? parameters : JSON.stringify( parameters );
        const cachedUrlValues = this.cache[ url ];
        if ( !cachedUrlValues ) {
            return null;
        }
        const cachedHash = cachedUrlValues[ hash ];
        if ( !cachedHash ) {
            return null;
        }

        return cachedHash.data;
    }

    /**
     * 
     * @param url {String} - url used to make the api
     * @param bodyParams {String} - the hash associated with the request parameters
     * @param response {ApiResponse} - data received as a http response
     */
    storeApiResponse = ( url = '', bodyParams = '', response: ApiResponse ): void => {
        this.cacheApiResponse( url, bodyParams, response );
    }

    /**
     * 
     * @param url {String} - url used to make the api
     * @param bodyParams {String} - the hash associated with the request parameters
     * @param response {ApiResponse} - data received as a http response
     */
    private cacheApiResponse ( url = '', bodyParams = '', response: ApiResponse ): void {
        let cachedUrlValues = this.cache[ url ];
        if ( !cachedUrlValues ) {
            cachedUrlValues = {};
            this.cache[ url ] = cachedUrlValues;
        }

        const timerId = this.createClearCachedDataTimer( url, bodyParams );

        cachedUrlValues[ bodyParams ] = {
            timerId,
            data: { ...response },
        };
    }

    /**
     * create the timer for a url/hash
     * @param url - {string} - represents the url used to make the http call
     * @param hash {String} - the hash associated with the request parameters
     */
    private createClearCachedDataTimer ( url: string, hash: string ): any {

        const timerId = setTimeout( () => {
            const cachedUrlValues = this.cache[ url ] || {};
            const methodValues = cachedUrlValues[ hash ];
            if ( !methodValues ) {
                return;
            }

            if ( methodValues && methodValues.timerId ) {
                clearTimeout( methodValues.timerId );
                delete cachedUrlValues[ hash ];
            }

        }, this.DEBOUNCE_TIME );

        return timerId;
    }

}

export default new Debouncer();