const getLocalStorageEvents = (clientId) => {
  const storageValue = browser.getLocalStorageItem("imsEvents");
  if (!storageValue) {
    return null;
  }
  const imsEvents = JSON.parse(storageValue);
  return imsEvents[clientId];
};

const injectAdobeImsNotReady = (src, clientData) => {
  browser.execute(
    (adobeLibSrc, clientData) => {
      const imsKey = clientData.key || "adobeIMS";

      var initializeClientData = function(clientData) {
        var client_id = clientData.client_id;

        var clientDataWithHandlers = {
          ...clientData,
          analytics: {
            appCode: "appcode",
            appVersion: "appVersion",
          },
          onAccessToken: (tokenData) => {
            recordEvent(client_id, "onAccessToken", tokenData.token);
          },
          onAccessTokenHasExpired: () => {
            recordEvent(client_id, "onAccessTokenHasExpired", null);
          },
          onReady: (state) => {
            recordEvent(client_id, "onReady", state);
          },
          onReauthAccessToken: (tokenData) => {
            recordEvent(client_id, "onReauthAccessToken", tokenData.token);
          },
          isSignedIn: (value) => {
            recordEvent(client_id, "isSignedIn", value);
          },
          onError: (errorType, error) => {
            recordEvent(client_id, "onError", { errorType, error });
          },
        };

        return clientDataWithHandlers;
      };

      clientData = initializeClientData(clientData);

      window.adobeid = clientData;
      window.getLocalStorageEvents = (clientId) => {
        const storageValue = browser.getLocalStorageItem("imsEvents");
        if (!storageValue) {
          return null;
        }
        const imsEvents = JSON.parse(storageValue);
        return imsEvents[clientId];
      };
      window.recordEvent = function(client_id, eventName, data) {
        const imsLocalStorageEvents = localStorage.getItem("imsEvents");
        const imsEvents = imsLocalStorageEvents
          ? JSON.parse(imsLocalStorageEvents)
          : {};
        if (!imsEvents[client_id]) {
          imsEvents[client_id] = {};
        }
        const clientEvents = imsEvents[client_id];
        clientEvents[eventName] = data;

        localStorage.setItem("imsEvents", JSON.stringify(imsEvents));
      };

      if (window["adobeImsFactory"]) {
        const imsLibInstance = window["adobeImsFactory"].createIMSLib(
          clientData,
          imsKey
        );
        window[imsKey] = imsLibInstance;
        return imsLibInstance.initialize();
      }

      const adobeImsLibScriptElement = document.createElement("script");
      adobeImsLibScriptElement.onerror = function(ex) {
        console.log("exception on load script ", ex);
      };

      adobeImsLibScriptElement.onabort = function(ex) {
        console.log("exception on load script ", ex);
      };
      adobeImsLibScriptElement.onload = () => {};

      document.head.appendChild(adobeImsLibScriptElement);

      adobeImsLibScriptElement.src = adobeLibSrc;
    },
    src,
    clientData
  );
};

const waitForClientEvent = (clientId, funcCondition) => {
  browser.waitUntil(function() {
    const storageValue = browser.getLocalStorageItem("imsEvents");
    if (!storageValue) {
      return false;
    }

    const imsEvents = JSON.parse(storageValue);
    if (!imsEvents) {
      return false;
    }

    const clientEvents = imsEvents[clientId];
    return clientEvents && funcCondition(clientEvents);
  });
}

module.exports = {
  getLocalStorageEvents,
  waitForClientEvent,
  injectAdobeImsNotReady,
  injectAdobeIms: (src, clientData) => {
    injectAdobeImsNotReady(src, clientData);

    const clientId = clientData.client_id;
    waitForClientEvent(clientId, obj =>  obj["onReady"] !== undefined);

    browser.waitUntil(() =>
      browser.execute(() => !window.transitionInProgress)
    );
  },
  initializeImsLibrary: (key) => {
    browser.execute((key) => {
      const instance = window[key];
      if (!instance) {
        throw new Error(`no ims instance for  ${key}`);
      }
      instance.initialize();
    }, key);
  },
  clearEvents: () => {
    browser.execute(() => {
      const imsEventsLocalStorage = localStorage.getItem("imsEvents");
      if (imsEventsLocalStorage) {
        localStorage.removeItem("imsEvents");
      }
    });
  },
  getAdobeImsInstance: (key = "adobeIMS") => {
    const imsInstance = browser.execute((key) => {
      return window[key];
    }, key);

    return imsInstance;
  }
  
};
