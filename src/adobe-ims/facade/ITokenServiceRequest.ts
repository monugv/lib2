import { ImsApis } from "../../ims-apis/ImsApis";

/**
 * interface used to pass only the necessary properties to main functionalities
 */
export interface ITokenServiceRequest {
    clientId: string;
    scope: string;
    imsApis: ImsApis;

    /**
     * if true, the token service it will use the local storage
     */
    useLocalStorage: boolean;

    /** 
      * if true, the token service it will call the validate token api
     */
    autoValidateToken?: boolean;
}
