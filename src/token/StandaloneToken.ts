
/**
 * class used to encapsulate the token and expiration ms;
 * this values are passed from outside of the library by using adobeid
 */
export class StandaloneToken {

    token = '';

    /**
     * representing the session identifier
     */
    sid = '';
    expirems = 0;

    constructor ( data: any ) {
        const { token, expirems } = data;
        this.token = token;
        this.expirems = expirems;
    }
}