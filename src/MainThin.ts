import ImsThinInitialization from './ImsThinInitialization';

/**
 * class used during the bundle process for the thin library
 */
class MainThin {

    constructor () {
        ImsThinInitialization.initAdobeIms();
    }

    /**
   * method used only for testing in order to ensure the libray is initialized
   */
    initialize (): boolean {
        return true;
    }

}

export default new MainThin();
