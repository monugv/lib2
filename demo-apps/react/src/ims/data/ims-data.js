export class ImsData {
  imslibData = {
    token: null,
    tokenValid: false,
    isSignedInUser: false,
    reauthToken: null,
    tokenHasExpired: false,
    ready: false,
    error: null,
    profile: null,
    appState: null,
  };

  onStateChanged = null;

  triggerOnStateChanged(newState) {
    this.imslibData = { ...newState };

    this.onStateChanged(newState);
  }

  constructor(onStateChanged, adobeid = null) {
    this.onStateChanged = onStateChanged;
    if (adobeid) {
      this.adobeIdData = {
        ...this.adobeIdData,
        ...adobeid,
      };
    }
  }

  adobeIdData = {
    client_id: "IMSLibJSTestClient",
    scope: "AdobeID,openid,creative_cloud",
    locale: "en_US",
    environment: "stg1",
    onAccessToken: (token) => {
      const imslibData = {
        ...this.imslibData,
        token,
        isSignedInUser: true,
      };
      this.triggerOnStateChanged(imslibData);
    },
    onAccessTokenHasExpired: () => {
      const imslibData = {
        ...this.imslibData,
        tokenHasExpired: true,
      };
      this.triggerOnStateChanged(imslibData);
    },
    onReauthAccessToken: (reauthToken) => {
      const imslibData = {
        ...this.imslibData,
        reauthToken,
        isSignedInUser: true,
      };
      this.triggerOnStateChanged(imslibData);
    },
    onError: (errortype, error) => {
      const imslibData = {
        ...this.imslibData,
        error: {
          errortype,
          error,
        },
        isSignedInUser: true,
      };
      this.triggerOnStateChanged(imslibData);
    },
    onReady: (context) => {
      const imslibData = {
        ...this.imslibData,
        ready: true,
        appState: context,
      };
      this.triggerOnStateChanged(imslibData);
    },
    onProfile: (profile) => {
      const imslibData = {
        ...this.imslibData,
        profile,
      };
      this.triggerOnStateChanged(imslibData);
    },
  };

  onTokenValid = (valid) => {
    const imslibData = {
      ...this.imslibData,
      tokenValid: valid,
      isSignedInUser: true,
    };
    this.triggerOnStateChanged(imslibData);
  };
}
