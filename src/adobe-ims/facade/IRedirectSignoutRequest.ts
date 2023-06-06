import { IDictionary } from '../../facade/IDictionary';

/**
 * interface used to define the property types of elements sent to LogoutRequest
 */
export interface IRedirectSignoutRequest {

    apiParameters: IDictionary;

    clientId: string;

    adobeIdRedirectUri: string | ( () => string );

    /**
     * An object containing various custom parameters for IMS which can be set by differnt applications
     */
    externalParameters: IDictionary;

}