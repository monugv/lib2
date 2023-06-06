import { AdobeIMSKey, AdobeImsFactory, AdobeIdKey } from "./constants/ImsConstants";
import { IAdobeIdData } from './adobe-id/IAdobeIdData';
import { AdobeIMSThin } from './adobe-ims/AdobeIMSThin';

/**
 * singleton class which is created on the same time when library is injected into the page.
 * it is used to provide the possibility to an external library to create a new instance of AdobeIMS
 * also, if the window contains a value for adobeId, it will create a new instance of AdobeIMS
 */
class ImsThinInitialization {

    /**
   * create a new instance of ims lib based on adobe id data
   */
    initAdobeIms (): void {
        window[AdobeImsFactory] = {
            createIMSLib: this.createIMSThinLib
        };

        let adobeIMS: AdobeIMSThin | null = window[AdobeIMSKey] || null;

        if ( !adobeIMS ) {
            const adobeIdData = window[AdobeIdKey];
            if ( !adobeIdData || !adobeIdData.client_id ) {
                return;
            }

            adobeIMS = this.createIMSThinLib( adobeIdData, AdobeIMSKey );
            adobeIMS.initialize();
        }

    }

  /**
   * 
   * @param adobeData represents the custom adobeData
   * @returns a new instance of the AdobeIms library based on input adobeIdData
   */
  private createIMSThinLib = ( adobeData: IAdobeIdData | null = null, adobeImsWindowKey = AdobeIMSKey ): AdobeIMSThin => {
      const adobeIMSThin = new AdobeIMSThin( adobeData );
      
      window[adobeImsWindowKey] = adobeIMSThin;

      return adobeIMSThin;
  };

}

export default new ImsThinInitialization();
