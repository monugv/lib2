import { IDictionary } from '../facade/IDictionary';
import { IAuthorizedApiRequest } from './IAuthorizedApiRequest';
import { IUnAuthorizedApiRequest } from './IUnAuthorizedApiRequest';
import { HEADERS } from '../constants/ImsConstants';
import UrlHelper from '../url/UrlHelper';
import ApiHelpers from '../api-helpers/ApiHelpers';
import Environment from '../adobe-ims/environment/Environment';
import ImsXhr from './xhr/ImsXhr';
import { ITransitoryAuthorizationRequest } from '../adobe-ims/facade/ITransitoryAuthorizationRequest';
import { AuthorizationCode } from '../token/AuthorizationCode';
import { IJumpTokenRequest } from '../adobe-ims/facade/IJumpTokenRequest';
import { IJumpTokenResponse } from '../adobe-ims/facade/IJumpTokenResponse';
import { ISocialHeadlessSignInRequest, ISocialHeadlessSignInResponse } from '../adobe-ims/facade/ISocialHeadlessSignIn';

/**
 * class used as a entry point for Ims api's
 * @todo discuss rate limit --> code 429 on http response.
 */

export class ImsApis {

  private CONTENT_FORM_ENCODED = 'application/x-www-form-urlencoded;charset=utf-8';

  apiParameters: any;
  /**
   * imsApis constructor;
   */
  constructor ( apiParameters: any = {} ) {
      this.apiParameters = apiParameters;
  }

  /**
   * validate the input token
   * @param request IAuthorizedApiRequest contains clientId and token information
   */
  validateToken ( request: IAuthorizedApiRequest ): Promise<any> {

      const { token, client_id } = request;

      const data =  UrlHelper.uriEncodeData( {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'validate_token' ),
          type: 'access_token',
          client_id,
          token
      } );

      const url = `${ Environment.baseUrlAdobe }/ims/validate_token/v1?jslVersion=${Environment.jslibver}`;

      const config = this.formEncoded();
      this.addClientIdInHeader( client_id, config );

      return ImsXhr.post(
          url,
          data,
          config );
  }

  /**
   * retrieve the profile based on the input token
   * @param request IAuthorizedApiRequest contains clientId and token information
   */
  getProfile ( request: IAuthorizedApiRequest ): Promise<any> {
      const { token, client_id } = request;

      const additionalParams = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'profile' )
      };

      const config = this.createAuthorizationHeader( token );
      this.addClientIdInHeader( client_id, config );

      const queryStrings = UrlHelper.uriEncodeData( {
          client_id,
          ...additionalParams,
      } );

      const url = `${ Environment.baseUrlAdobe }/ims/profile/v1?${ queryStrings }&jslVersion=${Environment.jslibver}`;

      return ImsXhr.get( url, config );
  }

  /**
   * @returns the user info based on the input token
   * @param request IAuthorizedApiRequest contains clientId and token information
   */
  getUserInfo ( request: IAuthorizedApiRequest ): Promise<any> {
      const { token, client_id } = request;
      const additionalParams = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'userinfo' )
      };

      const config = this.createAuthorizationHeader( token );
      this.addClientIdInHeader( client_id, config );

      const queryStrings = UrlHelper.uriEncodeData( {
          client_id,
          ...additionalParams,
      } );

      const url = `${ Environment.baseUrlAdobe }/ims/userinfo/v1?${ queryStrings }&jslVersion=${Environment.jslibver}`;

      return ImsXhr.get( url, config );
  }

  /**
    * invalidate the input token
    * @param request IAuthorizedApiRequest contains clientId and token information
    */
  logoutToken ( apiRequest: IAuthorizedApiRequest ): Promise<any> {
      const { client_id, token: access_token } = apiRequest;
      const additionalParams = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'logout_token' )
      };

      const url = `${ Environment.baseUrlServices }/ims/logout/v1?jslVersion=${Environment.jslibver}`;
      const config = this.addClientIdInHeader( client_id );

      return ImsXhr.post( url,
          {
              client_id,
              access_token,
              ...additionalParams,
          },
          config
      );
  }

  /**
   * Does an API to check the cookie status of the browser.
   */
  checkStatus (): Promise<any> {
      const url = `${ Environment.baseUrlServices }/ims/check/v1/status`;
      return ImsXhr.get( url );
  }

  /**
   * @returns a new token
   * @param request IUnAuthorizedApiRequest contains clientId information
   * @param userId { string } represents the user id associated with logged user
   * @todo We will probably need also check token v5
   */
  checkToken ( apiRequest: IUnAuthorizedApiRequest, externalParameters: IDictionary, userId: string ): Promise<any> {
      const { client_id, scope } = apiRequest;
      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'check_token' )
      };

      const apiBody: any = {
          ...additionalParams,
          client_id,
          scope
      };

      if( userId ) {
          apiBody.user_id = userId;
      }

      return this.callCheckToken(
          UrlHelper.uriEncodeData( apiBody ), client_id, `/check/v6/token?jslVersion=${Environment.jslibver}`
      )
  }

  /**
   * @returns a new token and profile for the existing user
   * @param request IUnAuthorizedApiRequest contains clientId information
   * @param userId contains the user id of the logged user
   * https://wiki.corp.adobe.com/display/ims/IMS+API+-+check+token#IMSAPIchecktoken-Version6
   */
  switchProfile ( apiRequest: IUnAuthorizedApiRequest, externalParameters: IDictionary, userId = '' ): Promise<any> {
      const { client_id, scope = '' } = apiRequest;

      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'check_token' )
      };

      const data = UrlHelper.uriEncodeData( {
          ...additionalParams,
          client_id,
          scope,
          user_id: userId,
      } );

      return this.callCheckToken(
          data, client_id, `/check/v6/token?jslVersion=${Environment.jslibver}`
      )
  }

  /**
   * @returns list of api providers
   * @param request IUnAuthorizedApiRequest contains clientId information
   */
  listSocialProviders ( apiRequest: IUnAuthorizedApiRequest ): Promise<any> {
      const { client_id } = apiRequest;

      const additionalParams = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'providers' )
      };

      const queryStrings = UrlHelper.uriEncodeData( {
          client_id,
          ...additionalParams
      } );

      const url = `${ Environment.baseUrlServices }/ims/social/v1/providers?${ queryStrings }&jslVersion=${Environment.jslibver}`;
      const config = this.addClientIdInHeader( client_id );

      return ImsXhr.get( url, config );
  }

  /**
  * @see {@link https://wiki.corp.adobe.com/display/ims/Implicit+Jump+Tokens |Implicit Jump Tokens}
  * @param request IUnAuthorizedApiRequest contains clientId and token information
  * @param ijt {string}
  */
  exchangeIjt ( apiRequest: IUnAuthorizedApiRequest, ijt: string ): Promise<any> {
      const { client_id } = apiRequest;
      const additionalParams: any = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'ijt' )
      };

      const url = `${ Environment.baseUrlServices }/ims/jump/implicit/${ ijt }`;

      let queryStrings = UrlHelper.uriEncodeData( {
          client_id,
          ...additionalParams
      } );

      let apiUrl = `${ url }?${ queryStrings }&jslVersion=${Environment.jslibver}`;
      if ( apiUrl.length > 2048 ) {
          delete additionalParams[ 'redirect_uri' ];
          queryStrings = UrlHelper.uriEncodeData( additionalParams );
          apiUrl = `${ url }?${ queryStrings }`;
      }

      const config = this.addClientIdInHeader( client_id );

      return ImsXhr.get( apiUrl, config );
  }

  /**
   * Returns the URL to the avatar of a user
   * @param {UserId} userId
   * @returns {String}
   */
  avatarUrl ( userId: string ): string {
      return `${ Environment.baseUrlAdobe }/ims/avatar/download/${ userId }`;
  }

  /**
   * Makes a request to IMS to get the Floodgate release flags.
   * Optionally accepts an access token from which to decode the release flags.
   * @param request IAuthorizedApiRequest contains clientId and token information
   */
  getReleaseFlags ( request: IAuthorizedApiRequest ): Promise<any> {

      const { token, client_id } = request;

      const additionalParams = {
          ...ApiHelpers.getCustomApiParameters( this.apiParameters, 'fg_value' )
      };

      const config = this.createAuthorizationHeader( token );
      this.addClientIdInHeader( client_id, config );

      const queryStrings = UrlHelper.uriEncodeData( {
          client_id,
          ...additionalParams,
      } );

      const url = `${ Environment.baseUrlAdobe }/ims/fg/value/v1?${ queryStrings }&jslVersion=${Environment.jslibver}`;

      return ImsXhr.get( url, config );

  }

  /**
   * Exchange the user's access_token for a Transitory Access Code (TAC) for target client and scope
   * @param tacRequest {ITransitoryAuthorizationRequest} - contains the request parameters
   * @param externalParameters {object} - contains the possible parameters used to override the api parameters
   * @param clientId {string} - the adobeid.client_id value
   */
  getTransitoryAuthorizationCode ( tacRequest: ITransitoryAuthorizationRequest, externalParameters: IDictionary = {}, clientId: string ): Promise<any> {

      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'check_token' )
      };

      const data = UrlHelper.uriEncodeData( {
          ...additionalParams,
          ...tacRequest
      } );

      return this.callCheckToken(
          data, clientId, `/check/v6/token?client_id=${clientId}&jslVersion=${Environment.jslibver}`
      )
  }


  /**
   * returns an access token from a authorization or device code
   * @param authorizationRequest {AuthorizationCode} contains the authorization request parameters
   * @param externalParameters {object} - contains the possible parameters used to override the api parameters
   */
  getTokenFromCode ( authorizationRequest: AuthorizationCode, externalParameters: IDictionary = {} ): Promise<any> {

      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'token' )
      };

      additionalParams.grant_type = 'authorization_code';
      delete authorizationRequest.other;

      const url = `${ Environment.baseUrlServices }/ims/token/v3?jslVersion=${Environment.jslibver}`;

      const data = UrlHelper.uriEncodeData( {
          ...additionalParams,
          ...authorizationRequest
      } );

      const config = this.formEncoded();
      this.addClientIdInHeader( authorizationRequest.client_id, config );

      return ImsXhr.post(
          url,
          data,
          config
      );
  }

  /**
   * Allows a client to launch a system-browser and arrive at another IMS-integrated application
   * @see {@link https://wiki.corp.adobe.com/pages/viewpage.action?spaceKey=ims&title=IMS+API+-+jumptoken }
   * @param jumpTokenRequest {JumpTokenRequest}
   * @param externalParameters {IDictionary}
   * @returns JumpTokenResponse
   */
  jumpToken ( jumpTokenRequest: IJumpTokenRequest, externalParameters: IDictionary = {}, clientId: string ): Promise<IJumpTokenResponse> {

      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'jumptoken' )
      };

      const url = `${ Environment.baseUrlServices }/ims/jumptoken/v1?client_id=${clientId}&jslVersion=${Environment.jslibver}`;

      const data = UrlHelper.uriEncodeData( {
          ...additionalParams,
          ...jumpTokenRequest
      } );

      const config = this.formEncoded();
      this.addClientIdInHeader( clientId, config );

      return ImsXhr.post(
          url,
          data,
          config
      );
  }

  /**
     * Provides signin / signup utility via the social native headless API
     * @see {@link https://wiki.corp.adobe.com/pages/viewpage.action?pageId=1106020498 }
     * @param id_token from provider
     * @param provider_id either google, facebook or apple
     */

  socialHeadlessSignIn ( socialHeadlessSignInRequest: ISocialHeadlessSignInRequest, externalParameters: IDictionary = {} ): Promise<ISocialHeadlessSignInResponse> {
      const additionalParams = {
          ...ApiHelpers.mergeExternalParameters( externalParameters, this.apiParameters, 'jumptoken' )
      };

      const url = `${Environment.baseUrlServices}/ims/social/v2/native?jslVersion=${Environment.jslibver}`;

      const data = UrlHelper.uriEncodeData( {
          ...additionalParams,
          ...socialHeadlessSignInRequest,
          response_type:'implicit_jump'
      } );

      return ImsXhr.post(
          url,
          data,
          this.formEncoded()
      );
  }

  /**
   * create the authorization header in case the accesToken exists
   * @param accessToken {string};
   * @returns {string}
   */
  private createAuthorizationHeader ( accessToken: string ): any {
      const headers = {};
      if ( accessToken ) {
          headers[HEADERS.AUTHORIZATION] = `Bearer ${ accessToken }`;
      }
      return headers;
  }

  /**
   *
   * @param headers the header which will be sent to ims server on API request
   */
  private formEncoded ( headers: IDictionary = {} ): IDictionary {
      headers["content-type"] = this.CONTENT_FORM_ENCODED;
      return headers;
  }

  /**
   * add clientId in header
   * @param clientId {string};
   * @param headers {IDictionary};
   */
  private addClientIdInHeader ( clientId: string, headers: IDictionary = {} ): IDictionary {
      headers["client_id"] = clientId;
      return headers;
  }

  private callCheckToken ( data, clientId, pathSuffix ) {
      const config = this.formEncoded();
      this.addClientIdInHeader( clientId, config );

      return ImsXhr.post(
          `${ Environment.checkTokenEndpoint.url }/ims${ pathSuffix }`,
          data,
          config
      ).catch( e => {
          if ( !Environment.checkTokenEndpoint.shouldFallbackToAdobe( e ) ) {
              throw e;
          }

          return ImsXhr.post(
              `${ Environment.checkTokenEndpoint.fallbackUrl }/ims${ pathSuffix }`,
              data,
              config
          )
      } );
  }

}
