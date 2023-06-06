import 'ts-polyfill/lib/es2018-promise';
import ImsThinInitialization from './ImsThinInitialization';

/**
 * class used during the bundle process for the thin library with polyfill
 */
class MainThinPolyfill {
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

export default new MainThinPolyfill();
