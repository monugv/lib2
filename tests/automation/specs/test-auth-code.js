const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");
const using = require("jasmine-data-provider");

const LoginService = require("../test-services/LoginService");


let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
testConfiguration.loadTestingEnvironment();
clientAC = {};
describe("Ims Automation authorization code not modal", () => {
  using(testConfiguration.testingScenarios(), (scenario) => {
    using(scenario.accounts, (account) => {
      using(scenario.clients, (client) => {
        testNo++;

        const clientAC = {
          ...client,
          client_id: 'IMSLibJSTestPublicClient',
          modalMode: false,
        };

        it(`navigate to next test`, () => {
          browserUrl = testConfiguration.environmentUrl();
          imsLibSrc = testConfiguration.imsLibLocation();

          browser.reloadSession();

          browser.url(browserUrl);
          $("body").waitForExist("body");

          browserActions.clearEvents();

          browserActions.injectAdobeIms(imsLibSrc, clientAC);

          const imsInstance = browserActions.getAdobeImsInstance();

          const imsEvents = browserActions.getLocalStorageEvents(
            clientAC.client_id
          );

          assert(imsInstance !== null);
          assert(imsEvents.onReady === null);
        });

        it(`sign in with Authorization Code and not modal ${testNo}`, () => {
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signIn({}, 5, 'code' );
          }, clientAC);

          LoginService.fillAccountCredentials(account);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, clientAC);

          browserActions.waitForClientEvent(
            clientAC.client_id,
            (obj) => obj["onAccessToken"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            clientAC.client_id
          );

          assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 1);

          expect(imsEvents.onReady).toEqual(5);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getProfile().then((v) => {
              window.onProfile = v;
            });
          }, clientAC);

          browser.waitUntil(() =>
            browser.execute(() => window && window.onProfile !== undefined)
          );
        });
       
      });
    });
  });
});
