import { ApiResponse } from "./ApiResponse"

export default new class Xhr {

    http ( options ): Promise<any> {

        return new Promise(  ( resolve, reject ) => {

            const xmlHttpObject = window.XMLHttpRequest;
            const xhr = new xmlHttpObject();

            if ( typeof options.withCredentials === 'boolean' ) {
                xhr.withCredentials = options.withCredentials
            } else {
                xhr.withCredentials = true;
            }

            if ( typeof options.timeout === 'number' ) {
                xhr.timeout = options.timeout
            }

            xhr.open( options.method, options.url, true );

            const addHeaders = function ( headers ): void {
                if ( !headers ) {
                    return;
                }
                Object.keys( headers ).forEach( function ( key ) {
                    xhr.setRequestHeader( key, headers[key] )
                } )
            }

            xhr.onload = function onload (): void {
                if ( this.status >= 200 && this.status < 300 ) {
                    return resolve( new ApiResponse( this.status, this.response ) );
                }
                return reject( new ApiResponse( this.status, this.response ) )
            }

            xhr.onerror = function onerror (): void {
                const error = new ApiResponse( this.status, this.response );
                return reject( error );
            }

            xhr.ontimeout = function onerror (): void {
                const error = new ApiResponse( 0, 'timeout' );
                return reject( error );
            }

            xhr.onabort = function onerror (): void {
                const error = new ApiResponse( 0, 'aborted' );
                return reject( error );
            }

            addHeaders( options.headers )
            xhr.send( options.data );
        } )
    }

    post (  url: string, data: any, headers = {}, withCredentials?: boolean, timeout?: number ): Promise<any> {
        return this.http( {
            headers,
            method: 'POST',
            url,
            data,
            withCredentials,
            timeout,
        } );
    }

    get ( url, headers = {}, withCredentials?: boolean, timeout?: number ): Promise<any> {
        return this.http( {
            headers,
            method: 'GET',
            url,
            withCredentials,
            timeout,
        } );
    }

}
