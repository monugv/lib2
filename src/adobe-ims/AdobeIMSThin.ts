import { SignInService } from './sign-in/SignInService';
import { SignOutService }from './sign-out/SignOutService';
import { AdobeIdThinData } from '../adobe-id/AdobeIdThinData';
import { IAdobeIdThinData } from "../adobe-id/IAdobeIdThinData";
import { IDictionary } from '../facade/IDictionary';
import { IRedirectSignoutRequest } from './facade/IRedirectSignoutRequest';
import FragmentHelper from '../url/FragmentHelper';
import { IReauth } from './facade/IReauth';
import { IGrantTypes } from './facade/IGrantTypes';
import { IAdobeIMSThin } from './facade/IAdobeIMSThin';
import { IRedirectRequest } from './facade/IRedirectRequest';

/**
 * Class used as a facade for ims library in order to provide public access only to a part of the main library functionalities
 * 
 */
export class AdobeIMSThin implements IAdobeIMSThin {

  /**
   * AdobeIdData
   * the values for adobeId are read from window.adobeid or passed by using the constructor
   */
  private adobeIdThinData: AdobeIdThinData | null = null;

  /**
   * 
   * @param adobeData {IAdobeData} if not null, the adobeIdData instance will be created based on this values
   */
  constructor ( adobeIdThinData: IAdobeIdThinData | null = null ) {
      this.adobeIdThinData = new AdobeIdThinData( adobeIdThinData );
  }

  /**
 * Method used to redirect the user to signin url
 *
 * <uml>
 * start
 * :SignIn;
 * :Create the redirect url;
 * :user must enter the credentials and after that is redirected to initial uri;
 * :developer should use the fragmentValues method and implement the token mangement; 
 * end
 * </uml>
 * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
 * @param nonce {string} string value used for csrf
 * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
 * @param grantType {IGrantTypes} represents the grant type used for sign in flow
 * 
*/
  signIn = ( externalParameters: IDictionary = {}, nonce = '',  contextToBePassedOnRedirect: any = {}, grantType: IGrantTypes = IGrantTypes.token ): Promise<void> => {
      const { adobeIdThinData } = this;
      if ( !adobeIdThinData ) {
          throw new Error( 'no adobeId on sign in' );
      }

      return adobeIdThinData.createRedirectRequest( externalParameters, contextToBePassedOnRedirect, nonce, grantType )
          .then( ( authorizeRequestData: IRedirectRequest ) => {
              new SignInService().signIn( authorizeRequestData );
              return Promise.resolve();
          } )
  };

  /**
   * Method used to return the authorization url; 
   * 
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param nonce {string} string value used for csrf
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   *  
  */
 getAuthorizationUrl = ( externalParameters: IDictionary = {}, nonce = '', contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<string> => {
     const { adobeIdThinData } = this;
     if ( !adobeIdThinData ) {
         throw new Error( 'no adobeId on sign in' );
     }

     return adobeIdThinData.createRedirectRequest( externalParameters, contextToBePassedOnRedirect, nonce, grantType )
         .then( ( authorizeRequestData: IRedirectRequest ) => {
             const authUrl = new SignInService().createRedirectUrl( authorizeRequestData );
             return Promise.resolve( authUrl );
         } )

 }

 /**
   * Method used to return the authorization url; 
   * 
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   *  
  */
 getSocialProviderAuthorizationUrl = ( providerName: string,  externalParameters: IDictionary = {}, contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<string> => {
     const { adobeIdThinData } = this;
     if ( !adobeIdThinData ) {
         throw new Error( 'no adobeId on sign in' );
     }

     return adobeIdThinData.createSocialProviderRedirectRequest( providerName, externalParameters, contextToBePassedOnRedirect, '', grantType )
         .then( ( authorizeRequestData: IRedirectRequest ) => {
             const url = new SignInService().createRedirectUrl( authorizeRequestData );
             return Promise.resolve( url );
         } )
     
 }


 /**
   * Method used to return the authorization url; 
   *
   * @param reauth {string}; represents the re authenticate value. available values are: check and force. default value is "check"  
   * @param requestedParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
  */
 getReauthenticateAuthorizationUrl = ( reauth = IReauth.check, requestedParameters: IDictionary = {},  contextToBePassedOnRedirect?: any, grantType: IGrantTypes = IGrantTypes.token ): Promise<string> => {
     const { adobeIdThinData } = this;
     if ( !adobeIdThinData ) {
         throw new Error( 'no adobeId on sign in' );
     }

     return adobeIdThinData.createReAuthenticateRedirectRequest( requestedParameters, contextToBePassedOnRedirect, '', reauth, grantType )
         .then( ( authorizeRequestData: IRedirectRequest ) => {
             const url = new SignInService().createRedirectUrl( authorizeRequestData );
             return Promise.resolve( url );
         } )

 }

 /**
   * Method used to return the authorization url; 
   * 
   * @param externalParameters {Object} object sent from outside in order to have the possibility to override the default values when the redirect uri is created
   * @param contextToBePassedOnRedirect {any | undefined} represents the context which is passed during redirect
   *  
  */
 getSignUpAuthorizationUrl = ( requestedParameters: IDictionary = {}, contextToBePassedOnRedirect?: any ): Promise<string> => {
     const { adobeIdThinData } = this;
     if ( !adobeIdThinData ) {
         throw new Error( 'no adobeId on sign in' );
     }

     return adobeIdThinData.createSignUpRedirectRequest( requestedParameters, contextToBePassedOnRedirect, '' )
         .then( ( authorizeRequestData: IRedirectRequest ) => {
             const signInService = new SignInService();
             return signInService.createRedirectUrl( authorizeRequestData );
         } )

 }

  /**
   * token {string} represents the token used for sign out
   * externalParameters {object} - external parameters passed to sign out
   * 
   * <uml>
   * start
   * :Signout;
   * :Create the redirect url;
   * :remove the token and profile from storage;
   * :developer should implement his scenario after signout 
   * end
   * </uml>
   */
  signOut = ( externalParameters: IDictionary = {} ): void => {
      const adobeIdData = this.adobeIdThinData;
      if ( !adobeIdData ) {
          throw new Error( 'no adobeId on sign out' );
      }

      const { api_parameters: apiParameters = {}, client_id: clientId, redirect_uri: adobeIdRedirectUri } = adobeIdData;

      const redirectRequest: IRedirectSignoutRequest = {
          adobeIdRedirectUri,
          apiParameters,
          clientId,
          externalParameters,
      };

      const signOutService = new SignOutService();

      signOutService.signOut( redirectRequest );
  };

  /**
   * method used to notify that the library has been initialized
   */
  initialize (): void {
      const { adobeIdThinData } = this;
      if ( !adobeIdThinData ) {
          throw new Error( 'Please provide the adobe Id data' );
      }
      adobeIdThinData.triggerOnReady( );
  }
  /**
   * Helper function used to transform fragment values into a json object
   */
  fragmentValues (): IDictionary | null {
      return FragmentHelper.fragmentToObject();
  }

  /**
   * Helper function used to return the nonce value from fragment
   */
  getNonce (): string | null {
      const fragment: IDictionary | null = this.fragmentValues();
      if ( !fragment ) {
          return null;
      }

      const { state = {} } = fragment;
      return state ? state["nonce"] || null : null;
  }

}

