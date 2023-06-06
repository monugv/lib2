import UriTestHelper from '../helpers/uri-test-helper';
import isEqual from 'lodash/isEqual';

import deepdiff from 'deep-diff';

const matcherParams = {
    obj1: null,
    obj2: null
};

/**
 * mather used for testing the url parameters
 * @param expected {Object} represent the expected object which contains the expected properties used for redirect
 */
export const redirectUriMatching = ( expected: any ): jasmine.AsymmetricMatcher<any> => {
    return {

        /*
         * The asymmetricMatch function is required, and must return a boolean.
         */
        asymmetricMatch: ( compareTo: any ): boolean => {
            const objUrl = UriTestHelper.createObjectFromUrl( compareTo );

            matcherParams.obj1 = objUrl;
            matcherParams.obj2 = expected;

            return isEqual( objUrl, expected );
        },

        /*
         * The jasmineToString method is used in the Jasmine pretty printer, and will
         * be seen by the user in the message when a test fails.
         */
        jasmineToString: (): string => {
            const diffValue = deepdiff.diff( matcherParams.obj1, matcherParams.obj2 );
            const diffMessage = JSON.stringify( diffValue );

            return diffMessage;

        }
    };
}

/**
 * mather used for testing the hash parameters from url
 * @param expected {Object} represent the expected object which contains the expected properties used for redirect
 */
export const hashMatching = ( expected: any ): jasmine.AsymmetricMatcher<any> => {
    return {

        /*
         * The asymmetricMatch function is required, and must return a boolean.
         */
        asymmetricMatch: ( compareTo: any ): boolean => {
            const { oldHash, urlWithoutOldHash } = UriTestHelper.getOldHash( compareTo )
            
            const redirectParams = UriTestHelper.redirectUrlToObject( urlWithoutOldHash || compareTo );
            const objUrl = UriTestHelper.combineRedirectParams( redirectParams, oldHash )

            matcherParams.obj1 = objUrl;
            matcherParams.obj2 = expected;

            return isEqual( objUrl, expected );
        },

        /*
         * The jasmineToString method is used in the Jasmine pretty printer, and will
         * be seen by the user in the message when a test fails.
         */
        jasmineToString: (): string => {
            const diffValue = deepdiff.diff( matcherParams.obj1, matcherParams.obj2 );
            const diffMessage = JSON.stringify( diffValue );

            return diffMessage;

        }
    };
}