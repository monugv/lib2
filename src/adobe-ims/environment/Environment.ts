import { IEnvironment } from "../../adobe-id/IEnvironment";
import { CheckTokenEndpoint } from "./CheckTokenEndpoint";

/**
 * class used to store the variables used for ims flow
 */
class Environment {

    /**
     * @property {String} Represents the base url used on api (back-end) call in case of getProfile, getUserInfo and validateToken;
     */
    baseUrlAdobe = '';

    /**
     * @property {string} Represents the base url used on api (back-end) call in case of logoutToken, checkStatus, listSocialProviders and exchangeIjt;
     */
    baseUrlServices = '';

    /**
     * @property {object} Represents the base url used on api (back-end) call in case of checkToken;
     */
    checkTokenEndpoint = new CheckTokenEndpoint();

    /**
     * @property {string} this parameter is passed to redirect uri during a sign in or sign out operation
     */
    jslibver = 'v2-v0.31.0-2-g1e8a8a8';

    loadEnvironment ( environment: IEnvironment, useProxy: boolean = false, hostname: string = '' ): void {
        const isStage = environment === IEnvironment.STAGE;
        if ( isStage ) {
            this.baseUrlAdobe = 'https://ims-na1-stg1.adobelogin.com';
            this.baseUrlServices = 'https://adobeid-na1-stg1.services.adobe.com';
        } else {
            this.baseUrlAdobe = 'https://ims-na1.adobelogin.com';
            this.baseUrlServices = 'https://adobeid-na1.services.adobe.com';
        }

        this.checkTokenEndpoint = CheckTokenEndpoint.computeEndpoint(
            useProxy, hostname, isStage, this.baseUrlServices
        )
    }

}

export default new Environment();
