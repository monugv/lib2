import { ImsApis } from "../../ims-apis/ImsApis";

/**
 * interface used to pass only the necessary properties to main functionalities
 */
export interface IServiceRequest {
    clientId: string;
    scope: string;
    imsApis: ImsApis;
}