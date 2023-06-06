const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");

const LoginService = require("../test-services/LoginService");

let browserUrl = "";
let imsLibSrc = "";

testConfiguration.loadTestingEnvironment();

const client = {
  client_id: "IMSLibJSTestClient",
  locale: 'en_US',
  scope: 'AdobeID,openid',
  environment: 'stg1',
};

const account = {
  password: "Tarantula9379((",
  username: "glo51506+0@adobetest.com",
  account_type: 'type1',
};

describe("Ride Error Automation tests", () => {

        it(`navigate to next test`, () => {
          browserUrl = testConfiguration.environmentUrl();
          imsLibSrc = testConfiguration.imsLibLocation();

          browser.reloadSession();

          browser.url(browserUrl);
          $("body").waitForExist("body");

          browserActions.clearEvents();

          browserActions.injectAdobeIms(imsLibSrc, client);

          const imsInstance = browserActions.getAdobeImsInstance();

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(imsInstance !== null);
          assert(imsEvents.onReady === null);
        });

        it(`sign in should redirect to ride error`, () => {
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signIn({}, 5);
          }, client);

          LoginService.fillAccountCredentials(account);

          browser.waitUntil(() => browser.execute(() => document.querySelectorAll("[data-id='PP-TermsOfUse-ContinueBtn']").length > 0));
          
        });
        
});
