
import 'ts-polyfill/lib/es2018-promise';

import ImsInitialization from './ImsInitialization';

/**
 * singleton class which is created on the same time when library is injected into the page.
 * it is used to provide the possibility to an external library to create a new instance of AdobeIMS
 * also, if the window contains a value for adobeId, it will create a new instance of AdobeIMS
 */
class MainPolyfill {

    constructor () {
        ImsInitialization.initAdobeIms();
    }

    /**
   * method used only for testing in order to ensure the libray is initialized
   */
    initialize (): boolean {
        return true;
    }

}

export default new MainPolyfill();
