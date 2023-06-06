/**
 * this class contains the available ims lib actions;
 */
export class ImsActions {
  imsLib = null;
  imsData = null;
  constructor(imsLib, imsData) {
    this.imsLib = imsLib;
    this.imsData = imsData;
  }

  getProfile = () => {
    this.imsLib.getProfile().then(profile => {
      this.imsData.adobeIdData.onProfile(profile);
    });
  }

  getReleaseFlags = () => {
    this.imsLib.getReleaseFlags().then(flags => {
      this.imsData.adobeIdData.flags = flags;
    })
    .catch(ex => this.imsData.adobeIdData.onError(ex));
  }

  signIn = () => {
    this.imsLib.signIn();
  };

  signOut = () => {
    this.imsLib.signOut();
  };

  getFragmentValues = () => {
    return this.imsLib.fragmentValues();
  };

  getAccessToken = () => {
    const token = this.imsLib.getAccessToken();
    this.imsData.adobeIdData.onAccessToken(token);
  };

  refreshToken = () => {
    this.imsLib.refreshToken();
  };

  isSignedInUser = () => {
    return this.imsLib.isSignedInUser();
  };

  reAuthenticateCheck = () => {
    this.imsLib.reAuthenticate();
  };

  reAuthenticateForce = () => {
    this.imsLib.reAuthenticate({}, "force");
  };

  getProfile = () => {
    this.imsLib
      .getProfile()
      .then((profile) => {
        this.imsData.adobeIdData.onProfile(profile);
      })
      .catch((ex) => {
        this.imsData.adobeIdData.onError(ex);
      });
  };

  validateToken = () => {
    this.imsLib
      .validateToken()
      .then((isTokenvalid) => {
        this.imsData.onTokenValid(isTokenvalid);
      })
      .catch((ex) => {
        this.imsData.adobeIdData.onError(ex);
      });
  };

  listSocialProviders = () => {
    this.imsLib
      .listSocialProviders()
      .then((socialProviders) => {
        this.imsData.adobeIdData.onSocialProviders(socialProviders);
      })
      .catch((ex) => {
        this.imsData.adobeIdData.onError(ex);
      });
  };

  signInWithSocialProvider = () => {
    this.imsLib.signInWithSocialProvider("google");
  };

  avatarUrl = () => {
    return this.imsLib.avatarUrl;
  };
}
