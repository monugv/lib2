
import HttpErrorHandler from '../../src/error-handlers/HttpErrorHandler';
import { HttpErrorResponse } from '../../src/error-handlers/HttpErrorResponse';
import { ApiResponse } from '../../src/ims-apis/xhr/ApiResponse';
import { RideException } from '../../src/token/RideException';
import { AdobeIdKey } from "../../src/constants/ImsConstants";
import { AdobeIdThinData } from "../../src/adobe-id/AdobeIdThinData";
import { RideRedirectUri } from "../../src/adobe-id/custom-types/CustomThinTypes";

describe( 'HttpErrorHandler', () => {

    it( 'should return network error ', () => {
        const response = HttpErrorHandler.verify( new ApiResponse( 0, '' ) );
        expect( response ).toEqual( new HttpErrorResponse( { error: 'networkError', retryAfter: 0, message: '' } ) );
    } );

    it( 'should return rate limit error ', () => {
        const response = HttpErrorHandler.verify( new ApiResponse( 429, '' ) );
        expect( response ).toEqual( new HttpErrorResponse( { error: 'rate_limited', retryAfter: 10, message: '' } ) );
    } );

    it( 'should return server_error error ', () => {
        const response = HttpErrorHandler.verify( new ApiResponse( 555, '' ) );
        expect( response ).toEqual( new HttpErrorResponse( { error: 'server_error', retryAfter: 0, message: '' } ) );
    } );


    it( 'should return isUnauthorize = false  if status code is NOT 401 ', () => {
        const isUnauthorize = HttpErrorHandler.isUnauthorizedException( new ApiResponse( 555, '' ) );
        expect( isUnauthorize ).toEqual( false );
    } );

    it( 'should return isUnauthorize = true  if status code is 401 ', () => {
        const isUnauthorize = HttpErrorHandler.isUnauthorizedException( new ApiResponse( 401, '' ) );
        expect( isUnauthorize ).toEqual( true );
    } );

    it( 'parseTokenResponseForRideErrors with jump', ( done ) => {
        const tokenResponse = { error: 'ride_AdobeID_acct_actreq', jump: 'jump' };
        const response = HttpErrorHandler.verify( new ApiResponse( 555, tokenResponse ) );


        expect( response instanceof RideException ).toBeTruthy();
        expect( response && response['jump'] ).toEqual( tokenResponse.jump );
        expect( response && response['code'] ).toEqual( tokenResponse.error );

        done();
    } );

    [
        {
            testCase: 'not added because DEFAULT',
            tokenJumpUri: 'http://l:8080/i.h?ft=code&ift=login#/',
            rideRedirectUri: 'DEFAULT',
            expectedJump: 'http://l:8080/i.h?ft=code&ift=login#/'
        },
        {
            testCase: 'current url because empty',
            tokenJumpUri: 'http://l:8080/i.h?ft=code&ift=login#/',
            rideRedirectUri: '',
            expectedJump: 'http://l:8080/i.h?ft=code&ift=login&redirect_uri=http%3A%2F%2Flocalhost%3A9235%2F#/'
        },
        {
            testCase: 'current url because undefined',
            tokenJumpUri: 'http://l:8080/i.h?ft=code&ift=login#/',
            rideRedirectUri: undefined,
            expectedJump: 'http://l:8080/i.h?ft=code&ift=login&redirect_uri=http%3A%2F%2Flocalhost%3A9235%2F#/'
        },
        {
            testCase: 'static url',
            tokenJumpUri: 'http://l:8080/i.h?ft=code&ift=login#/',
            rideRedirectUri: 'http://static.org',
            expectedJump: 'http://l:8080/i.h?ft=code&ift=login&redirect_uri=http%3A%2F%2Fstatic.org#/'
        },
        {
            testCase: 'dynamic url',
            tokenJumpUri: 'http://l:8080/i.h?ft=code&ift=login#/',
            rideRedirectUri: (error) => 'https://dynamic.org/' + error,
            expectedJump: 'http://l:8080/i.h?ft=code&ift=login&redirect_uri=https%3A%2F%2Fdynamic.org%2Fride_AdobeID_acct_actreq#/'
        },
        {
            testCase: 'not added because tokenJumpUri is invalid',
            tokenJumpUri: 'notAnUrl',
            rideRedirectUri: 'http://static.org',
            expectedJump: 'notAnUrl'
        }
    ].forEach(
        ( { testCase, tokenJumpUri, rideRedirectUri, expectedJump } ) => {
            it( `parseTokenResponseForRideErrors with jump and rideRedirectUri, redirect_uri is ${testCase}`,
                ( done ) => {
                  HttpErrorHandler.adobeIdThinData = null;

                  const adobeIdData = window[AdobeIdKey];
                  const newAdobeIdData = new AdobeIdThinData();
                  newAdobeIdData.rideRedirectUri = rideRedirectUri as RideRedirectUri;

                  window[AdobeIdKey] = newAdobeIdData;
                  try {
                    const tokenResponse = { error: 'ride_AdobeID_acct_actreq', jump: tokenJumpUri };
                    const response = HttpErrorHandler.verify( new ApiResponse( 555, tokenResponse ) );

                    expect( response instanceof RideException ).toBeTruthy();
                    expect( response && response['jump'] ).toEqual( expectedJump );
                    expect( response && response['code'] ).toEqual( tokenResponse.error );

                    done();
                  } finally {
                    window[AdobeIdKey] = adobeIdData;
                  }
                } )
        }
    )

    it( 'parseTokenResponseForRideErrors no jump', ( done ) => {
        const tokenResponse = { error: 'ride_AdobeID_acct_actreq' };

        const response = HttpErrorHandler.verify( new ApiResponse( 555, tokenResponse ) );

        expect( response instanceof RideException ).toBeTruthy();
        expect( response && response['jump'] ).toEqual( '' );
        expect( response && response['code'] ).toEqual( tokenResponse.error );

        done();
    } )

    it( 'parseTokenResponseForRideErrors with no RideError code', ( done ) => {
        const tokenResponse = { error: 'not_ride', jump: 'jump' };
        const response = HttpErrorHandler.verify( new ApiResponse( 555, tokenResponse ) );

        expect( response ).toEqual( new HttpErrorResponse( { error: 'server_error' } ) );

        done();
    } )


} );
