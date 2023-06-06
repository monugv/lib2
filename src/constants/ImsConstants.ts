export const AdobeIdKey = 'adobeid';

export const AdobeIMSKey = 'adobeIMS';

export const AdobeImsFactory = 'adobeImsFactory';

export const DEFAULT_LANGUAGE = 'en_US';
export enum STORAGE_MODE {
  LocalStorage = 'local',
  SessionStorage =  'session',
  MemoryStorage =  'memory'
}

export const HEADERS = {
    AUTHORIZATION: 'Authorization',
    X_IMS_CLIENT_ID: 'X-IMS-ClientId',
    RETRY_AFTER: 'Retry-after',
};

export const PROFILE_STORAGE_KEY = 'adobeid_ims_profile';
export const TOKEN_STORAGE_KEY = 'adobeid_ims_access_token';
export const ON_IMSLIB_INSTANCE = 'onImsLibInstance';
export const ASK_FOR_IMSLIB_INSTANCE_DOM_EVENT_NAME = 'getImsLibInstance';
