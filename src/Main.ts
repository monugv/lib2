import ImsInitialization from './ImsInitialization';

/**
 * Provides the possibility to an external library to create a new instance of AdobeIMS and this class is used as part of
 * the bundle process
 */
class Main {

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

export default new Main();
