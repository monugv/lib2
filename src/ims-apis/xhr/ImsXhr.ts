import Debouncer from "../../debounce/Debouncer";
import HttpErrorHandler from "../../error-handlers/HttpErrorHandler";
import { HttpErrorResponse } from "../../error-handlers/HttpErrorResponse";
import { RideException } from "../../token/RideException";
import { ApiResponse } from "./ApiResponse"
import Xhr from './Xhr';

export default new class ImsXhr {

    triggerOnError: Function | null = null;

    /**
     * check if the cache contains data for the same url and parameters value;
     * if true, returns the cached value otherwise make the http call
     * @param url - url used to make a POST http request
     * @param data - dat passed to the back-end
     * @param config - http configuration
    */
    post (  url: string, data: any, config = {} ): Promise<any> {
        const cachedData = Debouncer.getCachedApiResponse( url, data );
        if ( cachedData ) {
            const { status, data } = cachedData;
            return status === 200 ? Promise.resolve( data ) : Promise.reject( data );
        }

        return Xhr.post( url, data, config )
            .then( response => {
                return this.storeApiResponse( url, JSON.stringify( data ), response );
            } )
            .catch( ( ex: ApiResponse ) => {
                return this.verifyError(  url, JSON.stringify( data ), ex );
            } )
    }

    /**
     * check if the cache contains data for the input url
     * if true, returns the cached value otherwise make the http call
     * @param url - url used to make a POST http request
     * @param config - contains xmlhttprequest headers
    */
    get ( url, config: any = {} ): Promise<any> {
        const cachedData = Debouncer.getCachedApiResponse( url );
        if ( cachedData ) {
            const { status, data } = cachedData;
            return status === 200 ? Promise.resolve( data ) : Promise.reject( data );
        }

        return Xhr.get( url, config )
            .then( response => {
                return this.storeApiResponse( url, '', response );
            } )
            .catch( ( ex: ApiResponse ) => {
                return this.verifyError( url, '', ex );
            } )
    }

    /**
     *
     * @param exception {ApiResponse} - represents the back-end service
     * @param url: {string} - url used to call the api
     * @param bodyParams: {string} represents the body parameters
     */
    verifyError ( url: string, bodyParams: string, exception: ApiResponse ): Promise<any> {

        this.storeApiResponse( url, bodyParams, exception );

        const httpErrorResponse: HttpErrorResponse | RideException | null = HttpErrorHandler.verify( exception, url );

        return Promise.reject( httpErrorResponse || exception.data )
    }

    /**
    *
    * @param response {any} - represents the back-end service
    * @param url url: {string} - url used to call the api
    * @param bodyParams {string} represents the body parameters
    */
    storeApiResponse (  url: string, bodyParams = '', response: ApiResponse ): Promise<any> {
        Debouncer.storeApiResponse( url, bodyParams, response );

        return Promise.resolve( response.data );
    }
}
