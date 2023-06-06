import { IImsInstance } from "../../src/adobe-id/custom-types/CustomTypes";

export const ON_IMSLIB_INSTANCE = 'onImsLibInstance';
export const ASK_FOR_IMSLIB_INSTANCE_DOM_EVENT_NAME = 'getImsLibInstance';

class AnalyticsLibrary {

    imsInstances: IImsInstance[] = [];

    constructor () {
        this.subscribeToimsInstance();
        this.askForImsInstance();
    }

    private askForImsInstance = (): void => {
        const evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( ASK_FOR_IMSLIB_INSTANCE_DOM_EVENT_NAME, false, false, null );
        window.dispatchEvent( evt );
    }

    private subscribeToimsInstance = (): void => {
        window.addEventListener( ON_IMSLIB_INSTANCE,  this.onImsInstance, false );
    }
    private onImsInstance  = ( evt: any ): void => {
        this.imsInstances.push( evt.detail );
    }

    clear = (): void => {
        this.imsInstances = [];
    }
}

export default AnalyticsLibrary;