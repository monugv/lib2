import { ApiResponse } from "../ims-apis/xhr/ApiResponse";
import { AdobeIdThinData } from "../adobe-id/AdobeIdThinData";
import { RideException } from "../token/RideException";
import { HttpErrorResponse } from "./HttpErrorResponse";

/**
 * class used to create a IHttpErrorResponse object in case the code is != 200
 */
class HttpErrorHandler {

    adobeIdThinData: AdobeIdThinData | null = null;

    verify ( exception: ApiResponse, url = '' ): HttpErrorResponse | RideException | null {

        const { status, data } = exception;

        if ( !status ) {
            return new HttpErrorResponse( {
                error: 'networkError',
                message: data || ''
            } );
        }

        if ( status == 401 ) {
            return new HttpErrorResponse( {
                error: 'unauthorized',
            } );
        }

        const rideException = this.parseTokenResponseForRideErrors( data, url );
        if( rideException ) {
            return rideException;
        }

        if ( status == 409 ) {
            return data;
        }

        if ( status == 429 ) {
            return new HttpErrorResponse( {
                error: 'rate_limited',
                retryAfter: data.retryAfter ? parseInt( data.retryAfter ) : 10,
            } );
        }

        if ( status.toString().match( /5\d{2}/g ) ) {
            return new HttpErrorResponse( {
                error: 'server_error'
            } )
        }

        return null;

    }

    /**
        * parse the check token response to see if there are any ride errors
        * @param refreshException represents the response from check token call
        * @param url the called url; part of the PBA Expired Idle Session workaround
        * @returns a RideException or null in case that the error code is not one from RideExceptions
        */
    parseTokenResponseForRideErrors ( refreshException: any, url: string ): RideException | null {
        if ( !refreshException ) {
            return null;
        }
        const { error, jump } = refreshException;
        if ( !error ) {
            return null;
        }

        const isRideError = error.indexOf( 'ride_' ) === 0;
        if ( !isRideError ) {
            // the PBA Expired Idle Session workaround: If a check/token call fails
            // because the session has been idle longer that the org policy limit,
            // a `token_expired` error is returned. But it should've been a ride exception
            // so the user is redirected to SUSI. Until the fix is made in the backend
            // this workaround has been implemented
            if ( error === 'token_expired' && url.indexOf( 'check/v6/token' ) >= 0 ) {
                return new RideException( 'ride_pba_idle_session', '', true );
            }
            return null;
        }

        const jumpValue = this.addRedirectUriToJump( error, jump );

        return new RideException( error, jumpValue );
    }

    private addRedirectUriToJump ( error: string, jump: any ): string {
        if ( !jump || typeof jump !== 'string' ) {
            return '';
        }
        const jumpValue = jump as string;
        if ( !this.adobeIdThinData ) {
            this.adobeIdThinData = new AdobeIdThinData();
        }
        const redirectUri = this.adobeIdThinData.computeRideRedirectUri( error );
        if ( !redirectUri || redirectUri.length === 0 ) {
            return jumpValue;
        }

        try {
            const jumpUrl = new URL( jumpValue )
            jumpUrl.searchParams.append( "redirect_uri", redirectUri );
            return jumpUrl.toString();
        } catch ( e ) {
            return jumpValue;
        }
    }

    /**
     * check if the exception status has the code equal 401
     * @param exception represents the exception caught during get profile method
     * @returns true if the status code is 401, otherwise false
     */
    isUnauthorizedException ( exception: ApiResponse ): boolean {
        const { status = 0 } = exception;

        return status === 401;

    }
}

export default new HttpErrorHandler();
