import { IErrorType } from "../adobe-id/IErrorType";


/**
 * class used to trigger profile errors
 */
export class ProfileException  {

    message = null;

    errorType: IErrorType = IErrorType.PROFILE_EXCEPTION;
    constructor ( message: any ) {
        this.message = message;
    }
}