import { IDictionary } from './../facade/IDictionary';

/**
 * class used to implement the main functions used for query strings
 */
class UrlHelper {

    /**
   * Encodes data as a query string.
   * @param {Object} data - The data.
   * @returns {string} - The encoded string.
    * @example
    * encoded = uriEncodeData({
    *   first: true,
    *   foo: {
    *     bar: 'foobar'
    *   }
    * }) // -> first=true&foo=%7B%22bar%22%3A%22foobar%22%7D
    */
    uriEncodeData ( data: any ): string {

        if ( typeof data !== 'object' ) {
            return '';
        }
        const encodings: string[] = [];
        let encodedValue = '';

        let keyValue;
        for ( const key in data ) {
            keyValue = data[ key ];
            if ( keyValue === undefined ) {
                continue;
            }
            encodedValue = this.encodeValue( keyValue );

            encodings.push( encodeURIComponent( key ) + "=" + encodedValue );
        }
        return encodings.join( "&" );
    }

    /**
   * @param value : any; represents the value which will be encoded
   * @returns string. 
   */
    private encodeValue ( value: IDictionary ): string {
        if ( value === null ) {
            return 'null';
        }
        if ( typeof value === 'object' ) {
            return encodeURIComponent( JSON.stringify( value ) );
        }
        return encodeURIComponent( value );

    }

    /**
   * Opens the URL in the current page
   *
   * @param {!string} url
   */
    replaceUrl ( url: string ): void {
        if ( !url ) {
            return;
        }
        window.location.replace( url );
    }



    private async sleep ( timeout: number ): Promise<void> {
        return new Promise( resolve => setTimeout( resolve, timeout ) );
    }
    
    async replaceUrlAndWait ( url: string, timeout: number ): Promise<void> {
        if ( !url ) {
            return Promise.resolve();
        }
        window.location.replace( url );
        await this.sleep( timeout );
        return Promise.resolve();
    }


    /**
   * Opens the URL in the current page
   * @param {!string} url
   */
    setHrefUrl ( url: string ): void {
        if ( !url ) {
            return;
        }
        window.location.href = url;
    }

    /**
  * Change the hash from url to a new value without reloading the page
  * @param hash {String} represents the new hash value
  * 
  */
    setHash ( hash = '' ): void {
        window.location.hash = hash;
    }
}

export default new UrlHelper();