
import { IDictionary } from './../facade/IDictionary';
import { merge } from '../util/ObjectUtil'

/**
 * class used to store the helper functions
 */
class ApiHelpers {

    /**
   * Checks [adobeid.api_parameters]{@link adobeid} for custom parameters for an API.
   * @param apiName - represents the used api name
   * @param apiParameters - represents the parameters set from outside for api endpoints read from adobeId
   * @returns {!Object}
   */

  getCustomApiParameters = ( apiParameters: any, apiName: string ): IDictionary => {
      return apiParameters[apiName]||{};
  };

  /**
   * 
   * @param externalParameters external parameters received outside of the library
   * @param apiParameters the api parameters from AdobeId data
   * @param apiName api name
   * @returns IDictionary representing the merged properties
   */
  mergeExternalParameters ( externalParameters: IDictionary, apiParameters: any, apiName: string ): IDictionary {     
      return merge( this.getCustomApiParameters( apiParameters, apiName ), externalParameters );
  }

  /***
   * @param value {String} represents the 
   */
  toJson ( value: string ): object | null {
      try{
          if( typeof value !== 'string' ) {
              return value;
          }
          return JSON.parse( value );
      }
      catch {
          return null;
      }
  }

}

export default new ApiHelpers();
