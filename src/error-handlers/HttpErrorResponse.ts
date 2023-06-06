
/**
 * class used to pass the http errors to external applications
 */
export class HttpErrorResponse {
    error?: string;
    retryAfter?: number;
    message?: string;

    constructor ( data ) {
        const { error, retryAfter = 0, message = '' } = data;
        this.error = error;
        this.retryAfter = retryAfter;
        this.message = message;
    }

}