import UrlHelper from "../../url/UrlHelper";
import { IRedirectRequest } from "../facade/IRedirectRequest";
import Environment from "../environment/Environment";
import { BaseSignInService } from "./BaseSignInService";
import { ISignInService } from "./ISignInService";

/**
 * command responsable for user sign in
 */

export class SignInService extends BaseSignInService implements ISignInService {
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
   */
  signIn = ( redirectRequest: IRedirectRequest ): void => {
      const url = this.createRedirectUrl( redirectRequest );

      UrlHelper.setHrefUrl( url );
  };

  /**
   * 
   * @param token { String } value used to authorize a user based on this token value
   * @param redirectRequest { IRedirectRequest } contains the object properties which are passed to the authorize api
   */
  authorizeToken = ( token: string, redirectRequest: IRedirectRequest ): void => {
      const parameters = this.composeRedirectUrl( redirectRequest );
      if( token ) {
          parameters.user_assertion = token;
          parameters.user_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
      }

      const postForm: HTMLFormElement = this.createAuthorizeForm( parameters );
      postForm.submit();
  };

  /**
   * returns a html form containing all the properties from the parameter object
   * @param parameters {object} contains the properties which will be passed to authorize api (as form submit post action)
   */
  private createAuthorizeForm ( parameters: any ): HTMLFormElement {
      const formAction = `${Environment.baseUrlAdobe}/ims/authorize/v1`;

      const form = document.createElement( "form" ); 
      form.style.display = "none";
      form.setAttribute( "method", "post" ); 
      form.setAttribute( "action", formAction ); 
  
      let formEl: HTMLElement | null = null;
      let paramValue: any = null;
      let paramValueAsString = '';
      for( const propertyName in parameters ) {
          paramValue = parameters[propertyName];
          if( typeof paramValue === 'object' ) {
              if( Object.keys( paramValue ).length === 0 ) {
                  continue;
              }
              paramValueAsString  = JSON.stringify( paramValue );
          } else {
              paramValueAsString = paramValue;
          }
          
          if( paramValueAsString !== '' ) {
              formEl = this.createFormElement( 'input', 'text', propertyName, paramValueAsString );
              form.appendChild( formEl );
          }
      }
     
      document.getElementsByTagName( "body" )[0] 
          .appendChild( form ); 

      return form;
  }

  /**
   * create a new html form element; this element will be added to the form
   * @param inputType {String} input html element type
   * @param type {String} type of the input element
   * @param name {String} name of the input element
   * @param value {String} value for the element
   */
  private createFormElement ( inputType: string, type: string, name: string, value: string ): HTMLElement {
      const formElement = document.createElement( inputType ); 
      formElement.setAttribute( "type", type ); 
      formElement.setAttribute( "name", name ); 
      formElement.setAttribute( "value", value ); 

      return formElement;
  }
  
}
