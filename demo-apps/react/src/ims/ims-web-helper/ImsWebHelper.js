import ImsWebConstants from "../constants/ImsWebConstants";

/**
 * class used to inject the adobeims library
 */
class ImsWebHelper {
  /**
   * method used to inject the adobe ims library
   */
  injectAdobeIms() {
    if (window.adobeIMS) {
      return Promise.resolve(true);
    }
    const imslibPath = ImsWebConstants.imslibLocation;
    return this.addScript(imslibPath);
  }

  injectAdobeImsThin() {
    return this.addScript(ImsWebConstants.imslibThinLocation);
  }

  /**
   *
   * @param {*} url represents the url of the script which will be injected
   */
  addScript(url) {
    return new Promise((resolve, reject) => {
      var scriptElement = document.createElement("script");
      scriptElement.src = url;
      scriptElement.onload = (val) => {
        resolve(val);
      };
      scriptElement.onerror = (err) => {
        reject(err);
      };
      scriptElement.onabort = (err) => {
        reject(err);
      };

      document.head.appendChild(scriptElement);
    });
  }
}

export default new ImsWebHelper();
