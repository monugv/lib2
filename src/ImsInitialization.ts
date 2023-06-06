import { AdobeIMS } from './adobe-ims/AdobeIMS';

import { AdobeIMSKey, AdobeImsFactory, AdobeIdKey } from "./constants/ImsConstants";
import { IAdobeIdData } from './adobe-id/IAdobeIdData';

/**
 * singleton class which is created on the same time when library is injected into the page.
 * it is used to provide the possibility to an external library to create a new instance of AdobeIMS
 * also, if the window contains a value for adobeId, it will create a new instance of AdobeIMS
 */
class ImsInitialization {

    /**
   * create a new instance of ims lib based on adobe id data
   */
    initAdobeIms (): void {
        window[AdobeImsFactory] = {
            createIMSLib: this.createIMSLib
        };

        let adobeIMS: AdobeIMS | null = window[AdobeIMSKey] || null;

        if ( !adobeIMS ) {
            const adobeIdData = window[AdobeIdKey];
            if ( !adobeIdData || !adobeIdData.client_id ) {
                return;
            }
            adobeIMS = this.createIMSLib( adobeIdData, AdobeIMSKey );
            adobeIMS.initialize();
        }
        
    }

  /**
   * 
   * @param adobeData represents the custom adobeData
   * @returns a new instance of the AdobeIms library based on input adobeIdData
   */
  private createIMSLib = ( adobeData: IAdobeIdData | null = null, adobeImsWindowKey = AdobeIMSKey ): AdobeIMS => {
      const adobeIMS = new AdobeIMS( adobeData );
      window[adobeImsWindowKey] = adobeIMS;

      return adobeIMS;
  };

}

export default new ImsInitialization();
