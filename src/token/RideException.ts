/**
 * class used to store the ride errors after a check token call
 */
export class RideException {

    /**
     * new redirect url in case of a ride error
     */
    jump = '';

    /**
     * ride error code received during check token
     */
    code: string;

    /**
     * flags RideExceptions thrown as a workaround to the PBA Expired Idle Session issue
     */
    isPbaExpiredIdleSessionWorkaround: boolean;

    constructor ( code: string, jump: string, isPbaExpiredIdleSessionWorkaround = false ) {
        this.code = code;
        this.jump = jump;
        this.isPbaExpiredIdleSessionWorkaround = isPbaExpiredIdleSessionWorkaround;
    }
}
