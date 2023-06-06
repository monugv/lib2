
import { IAdobeIMS } from '../../adobe-ims/facade/IAdobeIMS';
import { IAdobeIMSThin } from '../../adobe-ims/facade/IAdobeIMSThin';
import { TokenFields } from '../../token/TokenFields';
import { IErrorType } from '../IErrorType';

/**
 * Custom function type used to trigger the error handler
 * Every call of the error handler should contain the error type and the associated message
 * @param type {IErrorType} - represents the error type used to trigger the error handler
 * @param message {any} - represents the custom error message or exception object
 */
export type OnErrorFunction = ( type: IErrorType, message: any ) => void;

export type OnImsInstanceFunction = ( imsInstance: IAdobeIMS | IAdobeIMSThin ) => void;

export type OnAccessTokenFunction = ( data: ITokenInformation ) => void;

export type OnProfileFunction = ( profile: any ) => void;

export type OnAccessTokenHasExpiredFunction = () => void;

export interface ITokenInformation {
    token: string;

    expire: Date;

    /**
     * represents the session identifier
     */
    sid: string;

    token_type?: string;

    impersonatorId?: string;

    isImpersonatedSession?: boolean;

    /**
     * represents pba policies
     */
    pbaSatisfiedPolicies?: string[];
}

export interface IImsInstance {
    clientId: string;

    instance: IAdobeIMS | IAdobeIMSThin;

}

export type OverrideErrorFunction = ( errorContext: any ) => boolean

export type ModalSignInCallbackFunction = ( response: TokenFields ) => boolean
