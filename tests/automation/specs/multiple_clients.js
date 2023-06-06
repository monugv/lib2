const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");

const LoginService = require("../test-services/LoginService");

let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
const environment = testConfiguration.loadTestingEnvironment();

const client0 = {
  client_id: "IMSLibJSTestClient",
  locale: "en_US",
  scope: "AdobeID,openid",
  environment,
  key: "adobeIMS",
};

const client1 = {
  client_id: "IMSLibJSTestClient1",
  locale: "en_US",
  scope: "AdobeID,openid",
  environment,
  key: "client1",
};

const stageOrProductScenario = testConfiguration.testingScenarios()[0];

describe("Multiple Clients Automation tests", () => {
  it(`navigate to next test`, () => {
    browserUrl = testConfiguration.environmentUrl();
    imsLibSrc = testConfiguration.imsLibLocation();

    browser.reloadSession();

    browser.url(browserUrl);
    $("body").waitForExist("body");

    browserActions.clearEvents();

    browserActions.injectAdobeImsNotReady(imsLibSrc, client0);
    browser.waitUntil(() => browser.execute(() => window["adobeIMS"]));

    browserActions.injectAdobeImsNotReady(imsLibSrc, client1);
    browser.waitUntil(() => browser.execute(() => window["client1"]));

    const imsInstance0 = browserActions.getAdobeImsInstance(client0.key);
    assert(imsInstance0 !== null);

    const imsInstance1 = browserActions.getAdobeImsInstance(client1.key);
    assert(imsInstance1 !== null);
  });

  it(`sign in ${testNo}`, () => {
    browser.execute((client1) => {
      let imsInstance = window[client1.key];
      imsInstance.signIn({}, 5);
    }, client1);

    LoginService.fillAccountCredentials(stageOrProductScenario.accounts[0]);

    $(".automationbody").waitForExist();

    browser.waitUntil(() =>
      browser.execute(() => !window.transitionInProgress)
    );

    browserActions.injectAdobeImsNotReady(imsLibSrc, client0);
    browser.waitUntil(() => browser.execute(() => window["adobeIMS"]));

    browserActions.injectAdobeImsNotReady(imsLibSrc, client1);
    browser.waitUntil(() => browser.execute(() => window["client1"]));
    browserActions.waitForClientEvent('IMSLibJSTestClient1', obj =>  obj["onReady"] !== undefined);

    const imsEvents = browserActions.getLocalStorageEvents(client1.client_id);
    assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

    const imsEvents0 = browserActions.getLocalStorageEvents(client0.client_id);
    assert(imsEvents0.onAccessTokenHasExpired !== undefined);

  });
});
