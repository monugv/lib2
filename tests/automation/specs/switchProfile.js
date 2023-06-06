const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");

const LoginService = require("../test-services/LoginService");

let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
const environment = testConfiguration.loadTestingEnvironment();

const client = {
  client_id: "IMSLibJSTestClient",
  locale: "en_US",
  scope: "AdobeID,openid",
  environment,
  key: "adobeIMS",
};

const user = {
  username: 'opincaru+US+imslib+1+T2E@adobetest.com',
  password: 'Bap@d0be',
  account_type: 'type1',
}

describe("Switch profile automation tests", () => {
  it(`navigate to next test`, () => {
    if(environment === testConfiguration.ENVIRONMENTS.prod) {
      return;
    }
    browserUrl = testConfiguration.environmentUrl();
    imsLibSrc = testConfiguration.imsLibLocation();

    browser.reloadSession();

    browser.url(browserUrl);
    $("body").waitForExist("body");

    browserActions.clearEvents();

    browserActions.injectAdobeImsNotReady(imsLibSrc, client);
    browser.waitUntil(() => browser.execute(() => window["adobeIMS"]));

   
    const imsInstance0 = browserActions.getAdobeImsInstance(client.key);
    assert(imsInstance0 !== null);
    
  });

  it(`sign in ${testNo}`, () => {
    if(environment === testConfiguration.ENVIRONMENTS.prod) {
      return;
    }
    browser.execute((client) => {
      let imsInstance = window[client.key];
      imsInstance.signIn({}, 5);
    }, client);

    LoginService.choosePersonalProfile(user);
    

    $(".automationbody").waitForExist();

    browser.waitUntil(() =>
      browser.execute(() => !window.transitionInProgress)
    );

    browserActions.injectAdobeImsNotReady(imsLibSrc, client);
    browser.waitUntil(() => browser.execute(() => window["adobeIMS"]));

    browserActions.waitForClientEvent(client.client_id, obj =>  obj["onReady"] !== undefined);

    let imsEvents = browserActions.getLocalStorageEvents(client.client_id);
    assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

    browserActions.clearEvents();
    browser.execute((client) => {
      let imsInstance = window[client.key];
      imsInstance.switchProfile('FB234382601028F30A49412A@f25f6b9b5e54bfff0a494206');
    }, client);

    browserActions.waitForClientEvent(client.client_id, obj =>  obj["onAccessToken"] !== undefined) ;

    imsEvents = browserActions.getLocalStorageEvents(client.client_id);

    assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

  });
});
