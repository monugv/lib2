import { IRedirectRequest } from "../facade/IRedirectRequest";
import PopupOpener from './PopupOpener';
import { BaseSignInService } from "./BaseSignInService";
import { PopupSettings } from './PopupSettings';
import { ISignInService } from './ISignInService';

/**
 * command responsable for user sign in
 */

export class SignInModalService extends BaseSignInService implements ISignInService {


  /**
   * function used to be triggered from the popup window
   */
  onPopupMessage: Function;

  /**
   * represents the popup settings 
   */
  popupSettings: PopupSettings

  /**
   * constructor of the SignInModalService 
   */
  constructor ( onPopupMessage: Function, popupSettings: PopupSettings ) {
      super();
      this.onPopupMessage = onPopupMessage;
      this.popupSettings = popupSettings;
  }
  
  /**
   * execute the sign in method which redirects the user to the login page
   * <uml>
   * start
   * :CreateRedirectUrl;
   * :merge api parameters with external parameters
   * :encode the merged parameters and call the /ims/authorize/v1/${encodedParameters} url
   * end
   * </uml>
   *
   * @param {IRedirectRequest} redirectRequest. contains all the adobeId necessary properties necessary for sign in
   * @param onPopupMessage {Function} represents the function used, as a hook, to be triggered when a message comes from popup
   */
  signIn = ( redirectRequest: IRedirectRequest,   ): void => {
      redirectRequest.state = {
          ...redirectRequest.state,
          imslibmodal: true,
      }

      const { nonce } = redirectRequest.state;

      const url = this.createRedirectUrl( redirectRequest );

      PopupOpener.openSignInWindow( url, nonce as string, this.popupSettings, this.onPopupMessage );

  };
}
