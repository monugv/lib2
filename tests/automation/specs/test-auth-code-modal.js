const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");
const using = require("jasmine-data-provider");

const LoginService = require("../test-services/LoginService");


let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
testConfiguration.loadTestingEnvironment();
modalACClient = {};
describe("Ims Automation authorization code modal", () => {
  using(testConfiguration.testingScenarios(), (scenario) => {
    using(scenario.accounts, (account) => {
      using(scenario.clients, (client) => {
        testNo++;

        modalACClient = {
          ...client,
          modalMode: true,
          client_id: 'IMSLibJSTestPublicClient',
        };

        it(`navigate to next test`, () => {
          browserUrl = testConfiguration.environmentUrl();
          imsLibSrc = testConfiguration.imsLibLocation();

          browser.reloadSession();

          browser.url(browserUrl);
          $("body").waitForExist("body");

          browserActions.clearEvents();

          browserActions.injectAdobeIms(imsLibSrc, modalACClient);

          const imsInstance = browserActions.getAdobeImsInstance();

          const imsEvents = browserActions.getLocalStorageEvents(
            modalACClient.client_id
          );

          assert(imsInstance !== null);
          assert(imsEvents.onReady === null);
        });

        it(`sign in with Authorization Code and modal ${testNo}`, () => {

          var originalWindowHandle = browser.getWindowHandle();
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signIn({}, 6, 'code');
          }, modalACClient);

          browser.switchToWindow("Adobe ID");

          LoginService.fillAccountCredentials(account);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeImsNotReady(imsLibSrc, modalACClient);
          browser.switchToWindow(originalWindowHandle);

          browserActions.waitForClientEvent(
            modalACClient.client_id,
            (obj) => obj["onAccessToken"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            modalACClient.client_id
          );

          assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

          expect(imsEvents.onReady).toEqual(6);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getProfile().then((v) => {
              window.onProfile = v;
            });
          }, modalACClient);

          browser.waitUntil(() =>
            browser.execute(() => window && window.onProfile !== undefined)
          );
        });

       
      });
    });
  });
});
