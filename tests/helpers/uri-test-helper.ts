import FragmentHelper from "../../src/url/FragmentHelper";

/**
 * class used only for tests in order to verify the values from the url
 */
class UriTestHelper {

    /**
   * returns most recent call values for the jasmine spy
   * @param spy Jasmine spy
   */
    mostRecent ( spy: jasmine.Spy ): any {
        const mostRecentResult = spy.calls.mostRecent();
        if( !mostRecentResult ) {
            return null;
        }
        const args = mostRecentResult.args;
        return args && args.length ? args[0] : null; 
    }
    /**
   * returns object representing the values from spy 
   * @param spy represents the replace url jasmine spy
   */
    createObjectFromReplaceUrlSpy ( spy: jasmine.Spy ): any {
        const url = spy.calls.mostRecent().args[ 0 ];
        return this.createObjectFromUrl( url );
    }

    /**
   * returns object representing the values from the url
   * @param url represents the url value
   */
    createObjectFromUrl ( url: string ): any {
        const params = this.redirectUrlToObject( url );
        const redirectUrl = params.redirect_uri as string || '';
        const { oldHash, urlWithoutOldHash } = this.getOldHash( redirectUrl )

        params.redirectParams = this.redirectUrlToObject( oldHash ? urlWithoutOldHash : redirectUrl );

        delete params.redirect_uri;

        const combinedRedirectParams = this.combineRedirectParams( params.redirectParams, oldHash )

        return { ...params, redirectParams: combinedRedirectParams };
    }

    /**
   * returns object representing the values from the url after #
   * @param redirectUrl {String} represents the redirect url value used for tests
   */
    redirectUrlToObject ( redirectUrl: string ): any {

        const questionIndex =  redirectUrl.indexOf( '?' ) +1;
        const hashIndex =  redirectUrl.indexOf( '#' ) + 1;
        
        if( !questionIndex && !hashIndex ) {
            return {};
        }

        let index = 0;
        if( questionIndex < hashIndex ) {
            index = questionIndex ? questionIndex : hashIndex;
        } else {
            index = hashIndex ? hashIndex : questionIndex;
        }

        redirectUrl = redirectUrl.substring( index );

        redirectUrl = redirectUrl.replace( '?', '&' );

        return FragmentHelper.getQueryParamsAsMap( redirectUrl );
    }

    /**
   * returns an object with old_hash and the redirect_uri without old_hash
   * @param source input url 
   */
    getOldHash (  source: string ): {oldHash: string; urlWithoutOldHash: string} {
        const oldHash = FragmentHelper.getOldHash( source )
        const urlWithoutOldHash = FragmentHelper.removeOldHash( source ) 

        return { oldHash, urlWithoutOldHash }
    }

    /**
   * returns object representing the values of redirectParams and old_hash
   * @param redirectParams represents the object in which redirect_uri params are transformed
   * @param oldHash represents the old_hash value
   */
    combineRedirectParams ( redirectParams: any, oldHash: string ): any {
        return { ...redirectParams, old_hash: oldHash };
    }

    /**
   * returns a new object with the redirect_uri values as being decoded and placed into a object
   * @param obj input object to be transformed
   */
    transformObjectRedirectUri ( obj: any ): any {
        obj.redirectParams = this.redirectUrlToObject( obj.redirect_uri );
        delete obj.redirect_uri;

        return obj;
    }

}

export default new UriTestHelper();
