import { IAdobeIdData } from "../../src/adobe-id/IAdobeIdData";
import { IEnvironment } from "../../src/adobe-id/IEnvironment";

const adobeIdDataValues: IAdobeIdData = {
    client_id: 'IMSLibJSTestClient',
    locale: 'ro',
    scope: 'adobeid',
    api_parameters: { test: 1 },
    onAccessToken: null,
    onAccessTokenHasExpired: null,
    onReauthAccessToken: null,
    onReady: null,
    onError: null,
    environment: IEnvironment.STAGE
};

export default adobeIdDataValues;
