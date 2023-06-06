import { RedirectHelper } from '../helpers/RedirectHelper';
import UrlHelper from '../../url/UrlHelper';
import { IRedirectSignoutRequest } from '../facade/IRedirectSignoutRequest';
import Environment from '../environment/Environment';
import { ThirdPartyProbingService } from "./ThirdPartyProbingService";

function doSignOut (
    redirectRequest: IRedirectSignoutRequest, probingResults: number[] | undefined = undefined
) {
    const apiName = 'logout';
    const { apiParameters, externalParameters, adobeIdRedirectUri = '', clientId } = redirectRequest;
    const apiExternalParams = RedirectHelper.mergeApiParamsWithExternalParams( apiParameters, externalParameters, apiName );
    const redirectUrl = RedirectHelper.createDefaultRedirectUrl( adobeIdRedirectUri, clientId, apiExternalParams, apiName );

    let parameters = {
        ...apiExternalParams,
        client_id: clientId,
        redirect_uri: redirectUrl,
        jslVersion: Environment.jslibver,
    };
    if( probingResults ) {
        parameters = Object.assign( parameters, { probingResults } )
    }

    const queryStrings = UrlHelper.uriEncodeData( parameters );
    const url = `${ Environment.baseUrlAdobe }/ims/logout/v1?${ queryStrings }`;

    UrlHelper.replaceUrl( url );
}

/**
 * command responsible for user sign out
 */
export class SignOutService {
  /**
   * @param {IRedirectRequest} redirectRequest. contains all the necessary properties necessary for sign out
   */
  signOut = ( redirectRequest: IRedirectSignoutRequest ): void => {
      const { clientId } = redirectRequest;
      // To support the Cross-Domain Session Cookies, the third party domains
      // should be probed before logging-out, so they can be included in the
      // cookie-deleting redirect chain
      if( Environment.checkTokenEndpoint.proxied ) {
          new ThirdPartyProbingService().probe( [Environment.checkTokenEndpoint.url], clientId )
              .then( probingResults => {
                  doSignOut( redirectRequest, probingResults )
              } )
              // Shunt third party domains if any errors occur
              .catch( () => {
                  doSignOut( redirectRequest )
              } )
      } else {
          doSignOut( redirectRequest )
      }
  };
}
