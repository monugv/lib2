import ApiHelpers from '../api-helpers/ApiHelpers';
import { IDictionary } from '../facade/IDictionary';

/**
 * class used to implement the main functions used for fragment
 */
class FragmentHelper {

    fragmentToObject ( urlArg?: string ): IDictionary | null {
        const currentHash = this.getHashFromURL( urlArg );
        if ( !currentHash ) {
            return null;
        }

        const url = this.processHashUrl( currentHash );
        const oldHash = this.getOldHash( url );

        // fragment values should contain only values starting with old_hash
        //this is in case when hash route is used: e.g.: https://localhost.corp.adobe.com:9000/#/cdn#old_hash=...
        //#/cdn# should be ignored when getQueryParamsAsMap is called;
        const urlWithoutRoute = oldHash ? url.slice( url.indexOf( 'old_hash' ) ) : url;

        const urlWithoutOldHash = this.removeOldHash( urlWithoutRoute );

        const imsResponseAsMap: IDictionary = this.getQueryParamsAsMap( urlWithoutOldHash );

        if( oldHash ) {
            imsResponseAsMap['old_hash'] = oldHash;
        }

        const stateAsString = imsResponseAsMap['state'];
        if( stateAsString ) {
            imsResponseAsMap['state'] = ApiHelpers.toJson( stateAsString as string );
        }

        return imsResponseAsMap;
    }

    /**
     * function used to determine the old_hash value contained into the source
     * @param source {String} represents the input source used to determine the old_hash
     * @returns {String}
     */
    getOldHash ( source: string ): string {
        if( !source ) {
            return '';
        }
        const match = source.match( 'old_hash=(.*?)&from_ims=true' );
        if( !match ) {
            return '';
        }
        return match[1];
    }

    /**
     * remove the old hash value from the input string
     * @param source {String} represents the input source
     */
    removeOldHash ( source: string ): string {
        if( !source ) {
            return source;
        }
        return source.replace( /old_hash=(.*?)&from_ims=true/gi, 'from_ims=true' );
    }

    /**
   * Gets the hash from an url.
   * @param {string=} url The URL from which to get the hash.
   * If missing use the current page's URL.
   * @Note: the # is not returned from url
   * @returns {string}
   */
    getHashFromURL ( url: string = window.location.href ): string {
        const index = url.indexOf( "#" );
        return index !== -1 ? url.substring( index + 1 ) : "";
    }

    /**
   * Parses a query string to a JSON.
   * @NOTE Sometimes, the query string is actually a hash, due to inconsistent servers
   * @param source {String}; represents the inpt strring value wich will be transformed to object
   * @returns {!Object}
   */
    getQueryParamsAsMap ( source: string ): IDictionary {
        if ( !source ) {
            return {};
        }
        const paramMap: IDictionary = {};

        //in case the source starts with #, ? or &, the first character is removed. 
        source = source.replace( /^(#\/|\/|#|\?|&)/, "" );
    
        source.split( "&" ).forEach( keyValuePair => {
            if ( keyValuePair.length ) {
                const arr = keyValuePair.split( "=" );
                paramMap[ arr[ 0 ] ] = decodeURIComponent( arr[ 1 ] );
            }
        } );

        return paramMap;
    }

    /**
   * @param source {string} represent the input source wich will be processed 
   * The backend appends a second "#" sign to redirect_uri, even if it already contains one.
   * @see https://jira.corp.adobe.com/browse/IMSB-4107554
   */
    private processHashUrl ( source: string ): string {
        return source
            .replace( "?error", "#error" )
            .replace( /#/gi, '&' )
            .replace( 'from_ims=true?', 'from_ims=true&' );
    }
}

export default new FragmentHelper();