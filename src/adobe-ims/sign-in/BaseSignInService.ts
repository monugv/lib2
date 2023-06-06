import { IDictionary } from "../../facade/IDictionary";
import UrlHelper from "../../url/UrlHelper";
import Environment from "../environment/Environment";
import { IRedirectRequest } from "../facade/IRedirectRequest";
import { RedirectHelper } from "../helpers/RedirectHelper";
import { merge } from "../../util/ObjectUtil";

/**
 * command responsable for user sign in
 */

export class BaseSignInService {
  
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
  composeRedirectUrl = ( redirectRequest: IRedirectRequest ): any => {
      const apiName = "authorize";

      const {
          apiParameters,
          externalParameters = {},
          adobeIdRedirectUri = "",
          clientId,
          locale: localeAdobeId,
          state = {},
      } = redirectRequest;

      const {
          scope = externalParameters["scope"] || apiParameters["scope"] || "",
      } = redirectRequest;

      const apiExternalParams = RedirectHelper.mergeApiParamsWithExternalParams(
          apiParameters,
          externalParameters,
          apiName
      );

      if( state ) {
          apiExternalParams.state = merge( apiExternalParams.state as object || {}, state );
      }
      
      const redirectUrl = RedirectHelper.createRedirectUrl(
          adobeIdRedirectUri,
          clientId,
          apiExternalParams,
          apiName,
          scope as string,
      );

      const locale = externalParameters.locale || localeAdobeId || '';
      const {
          // eslint-disable-next-line @typescript-eslint/camelcase
          response_type = apiExternalParams["response_type"] as string || '',
      } = redirectRequest;

      const parameters: IDictionary = {
          ...apiExternalParams,
          client_id: clientId,
          scope,
          locale,
          response_type,
          jslVersion: Environment.jslibver,
          redirect_uri: redirectUrl,
      };

      return parameters;
  };

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
  createRedirectUrl = ( redirectRequest: IRedirectRequest ): string => {

      const parameters = this.composeRedirectUrl( redirectRequest );

      const queryStrings = UrlHelper.uriEncodeData( parameters );

      const url = `${Environment.baseUrlAdobe}/ims/authorize/v1?${queryStrings}`;

      return url;
  };

}
