const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");
const using = require("jasmine-data-provider");

const LoginService = require("../test-services/LoginService");


let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
testConfiguration.loadTestingEnvironment();
modalClient = {};
describe("Ims Automation modal tests", () => {
  using(testConfiguration.testingScenarios(), (scenario) => {
    using(scenario.accounts, (account) => {
      using(scenario.clients, (client) => {
        testNo++;

        modalClient = {
          ...client,
          modalMode: true,
          modalSettings: {
            allowedOrigin: 'https://localhost.corp.adobe.com:9000'
          }
        };

        it(`navigate to next test`, () => {
          browserUrl = testConfiguration.environmentUrl();
          imsLibSrc = testConfiguration.imsLibLocation();

          browser.reloadSession();

          browser.url(browserUrl);
          $("body").waitForExist("body");

          browserActions.clearEvents();

          browserActions.injectAdobeIms(imsLibSrc, modalClient);

          const imsInstance = browserActions.getAdobeImsInstance();

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(imsInstance !== null);
          assert(imsEvents.onReady === null);
        });

        it(`sign in ${testNo}`, () => {
          var originalWindowHandle = browser.getWindowHandle();
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signIn({}, 5);
          }, modalClient);

          browser.switchToWindow("Adobe ID");

          LoginService.fillAccountCredentials(account);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeImsNotReady(imsLibSrc, modalClient);
          browser.switchToWindow(originalWindowHandle);

          browserActions.waitForClientEvent(
            client.client_id,
            (obj) => obj["onAccessToken"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

          expect(imsEvents.onReady).toEqual(5);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getProfile().then((v) => {
              window.onProfile = v;
            });
          }, client);

          browser.waitUntil(() =>
            browser.execute(() => window && window.onProfile !== undefined)
          );
        });

      });
    });
  });
});
