
/**
 * class used only by the popup window in order to know that the parent should be notified 
 * it is triggered by getTokenFields if the redirect state contains imslibmodal propery
 * during imslib initialization, if this type of event is received than the parent window will be notified
 */
export class ModalSignInEvent  {

    /**
     * represents the property used by popup window, to set the redirect url
     * this property will be used only if the popup.opener is not defined (edge bug)
     */
     wndRedirectPropName = '';

     /**
      * this type of event is triggered by get token from fragment method (in case imslibmodal from fragment is true)
      * @param wndRedirectPropName {String} represents the property used by popup window to set the redirect url
      */
     constructor ( wndRedirectPropName: string ) {
         this.wndRedirectPropName = wndRedirectPropName;
     }
}
