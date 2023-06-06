
/**
 * class used to encapsulate the token expired message
 */
export class TokenExpiredException  {

    exception = null;

    constructor ( exception: any ) {
        this.exception = exception;
    }
}