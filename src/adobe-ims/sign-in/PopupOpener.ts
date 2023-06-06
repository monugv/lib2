import { PopupSettings } from "./PopupSettings";


const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const ALLOWED_ORIGINS = [ 'https://auth.services.adobe.com', 'https://auth-stg1.services.adobe.com', 'https://localhost.corp.adobe.com:9000' ];
/**
 * class used to open a new authorization popup
 */
class PopupOpener {

    /**
     * refernce of the window object
     */
    private windowObjectReference: Window | null = null;

    /**
     * represents the previous url used to open the popup window
     */
    private previousUrl = '';

    /**
     * hook function used to pipe the received data from the parent popup the the AdobeIMS instance context
     */
    private onProcessLocation: Function| undefined;

    /**
     * timer handler used to read the href from popup window; 
     * note: it is used only in case the parent.opener is undefined; edge bug!
     */
    private timerId;


    /**
     * optional property that can be set when opening the popup in order to allow an origin other than
     * the default auth.services.adobe.com
     */
    private allowOrigin?;

    private broadcastChannel?: BroadcastChannel;


    /**
     * open the popup window used for authorization
     * @param url {String} url of the popup window
     * @param popupSettings {object} contains the popup setting as height and width
     * @param onPopupMessage {Function} function used to transfer the data from popup
     */
    openSignInWindow = ( url: string, popupHaspProp: string, popupSettings: PopupSettings, onPopupMessage: Function ): void => {
        this.onProcessLocation = onPopupMessage;

        this.allowOrigin = popupSettings.allowOrigin;

        if( this.timerId ) {
            clearInterval( this.timerId );
        }
        
        // remove any existing event listeners
        window.removeEventListener( 'message', this.receiveMessage );

        // add the listener for receiving a message from the popup
        window.addEventListener( 'message', this.receiveMessage );

        this.broadcastChannel && this.broadcastChannel.close();

        this.broadcastChannel = new BroadcastChannel( "imslib" );

        this.broadcastChannel.onmessage = this.receiveMessage;

        // window features
        const strWindowFeatures = `toolbar=no, menubar=no, width=${popupSettings.width}, height=${popupSettings.height}, top=${popupSettings.top}, left=${popupSettings.left}`;

        if ( !this.windowObjectReference || ( this.windowObjectReference && this.windowObjectReference.closed ) ) {
            /* if the pointer to the window object in memory does not exist or if such pointer exists but the window was closed */
            this.windowObjectReference = window.open( url, popupSettings.title, strWindowFeatures );
        } else if ( this.previousUrl !== url ) {
            /* if the resource to load is different, then we load it in the already opened secondary window and then  we bring such window back on top/in front of its parent window. */
            this.windowObjectReference = window.open( url, popupSettings.title, strWindowFeatures );
            this.windowObjectReference && this.windowObjectReference.focus();
        } else {
            /* else the window reference must exist and the window is not closed; therefore, we can bring it back on top of any other window with the focus() method. There would be no need to re-create
                the window or to reload the referenced resource. */
            this.windowObjectReference.focus();
        }

        // assign the previous URL
        this.previousUrl = url;
    };

    /**
     * function used to receive the message from the popup window
     * @param event {window event} contains the dom event passed by popup window
     */
    receiveMessage = ( event ): void => {
        if ( ![...ALLOWED_ORIGINS, this.allowOrigin].includes( event.origin ) ) {
            console.warn( "refused to receive message from origin not whitelisted", event.origin )
            return;
        }
        try {
            if( !URL_REGEX.test( event.data ) ) {
                console.warn( "refused to receive message containing unknown data format", event.data )
                return;
            }
        } catch( err ) {
            console.error( err )
            return;
        }
        this.broadcastChannel && this.broadcastChannel.close();
        this.onProcessLocation && this.onProcessLocation( event.data );
    };

}

export default new PopupOpener();
