import { IDictionary } from '../facade/IDictionary';
import { IAdobeHandlers } from './IAdobeHandlers';

/**
 * interface used to pass only the necessary properties to manin functionalities
 */
export interface IAdobeDataTokenRequest {
    clientId: string;
    scope: string;
    handlers: IAdobeHandlers;
    aditionalParams: IDictionary;
}