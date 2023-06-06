
/**
 * interface used to pass the http errors to external applications
 */
export interface IHttpErrorResponse {
    error?: string;

    retryAfter?: number;

    message?: string;

}