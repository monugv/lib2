const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");

const using = require("jasmine-data-provider");

const LoginService = require("../test-services/LoginService");

let browserUrl = "";
let imsLibSrc = "";

const ACCOUNT_TYPES = {
  type3: "type3",
};

let testNo = 0;
testConfiguration.loadTestingEnvironment();

describe("Ims Automation tests for reauth and signout", () => {
  using(testConfiguration.testingScenarios(), (scenario) => {
    using(scenario.accounts, (account) => {
      using(scenario.clients, (client) => {
        testNo++;

        it(`navigate to next test`, () => {
          browserUrl = testConfiguration.environmentUrl();
          imsLibSrc = testConfiguration.imsLibLocation();

          browser.reloadSession();

          browser.url(browserUrl);
          $("body").waitForExist("body");

          browserActions.clearEvents();

          browserActions.injectAdobeIms(imsLibSrc, client);

          const imsInstance = browserActions.getAdobeImsInstance();

          assert(imsInstance !== undefined);
        });

        it(`reAuthenticate check ${testNo}`, () => {
          browserActions.clearEvents();
          browser.execute(() => {
            delete window["onReady"];
            const imsInstance = window["adobeIMS"];

            imsInstance.reAuthenticate(null, "check", { state: 6 });
          }, client);

          LoginService.fillAccountCredentials(account);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(
            imsEvents.onReauthAccessToken &&
              imsEvents.onReauthAccessToken.length > 0
          );
          assert(!imsEvents.onAccessToken);

          expect(imsEvents.onReady).toEqual({
            state: 6,
          });
        });

        it(`reAuthenticate force ${testNo}`, () => {
          browserActions.clearEvents();
          browser.execute(() => {
            delete window["onReauthAccessToken"];
            const imsInstance = window["adobeIMS"];

            imsInstance.reAuthenticate({}, "force");
          }, client);

          LoginService.fillAccountCredentials(account, false, false);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(
            imsEvents.onReauthAccessToken &&
              imsEvents.onReauthAccessToken.length > 0
          );
          assert(!imsEvents.onAccessToken);
        });

        it(`refreshToken after reauth ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );
          const tokenBeforeRefresh = imsEvents.onReauthAccessToken;

          browser.execute(() => {
            delete window["onAccessToken"];
            delete window["onAccessTokenHasExpired"];

            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken();
          }, client);
          browserActions.waitForClientEvent('IMSLibJSTestClient', obj =>  obj["onAccessToken"] !== undefined);

          imsEvents = browserActions.getLocalStorageEvents(client.client_id);

          assert(
            imsEvents.onReauthAccessToken &&
              imsEvents.onReauthAccessToken.length > 0
          );
          assert(imsEvents.onAccessToken && imsEvents.onAccessToken.length > 0);
          assert(imsEvents.onAccessToken !== tokenBeforeRefresh);
        });

        it(`signOut after reauth${testNo}`, () => {
          browserActions.clearEvents();

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.signOut();
          }, client);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

          const tokens = browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            const reauthoken = imsInstance.getReauthAccessToken();
            const accessToken = imsInstance.getAccessToken();

            return {
              reauthoken,
              accessToken,
            };
          }, client);

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(!tokens.reauthoken && !tokens.accessToken);

          assert(!imsEvents.onReauthAccessToken && !imsEvents.onAccessToken);
        });

        it(`refreshToken after signout ${testNo}`, () => {
          browser.execute(() => {
            delete window["onAccessTokenHasExpired"];
            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken();
          }, client);

          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onAccessTokenHasExpired"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(!imsEvents.onReauthAccessToken && !imsEvents.onAccessToken);
        });

        it(`reAuthenticate force after signout ${testNo}`, () => {
          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.reAuthenticate({}, "force");
          }, client);

          LoginService.fillAccountCredentials(account,true, false);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onReauthAccessToken"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(
            imsEvents.onReauthAccessToken &&
              imsEvents.onReauthAccessToken.length > 0
          );
          assert(!imsEvents.onAccessToken);
        });

        it(`refreshToken after reauthenticate ${testNo}`, () => {
          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken();
          }, client);

          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onAccessToken"] !== undefined
          );

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(imsEvents.onReauthAccessToken && imsEvents.onAccessToken);
        });

        it(`new browser tab and check the reauth token ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          const reauth = imsEvents.onReauthAccessToken;

          browserUrl = testConfiguration.environmentUrl();

          browser.newWindow(browserUrl, "Testing window");

          imsLibSrc = testConfiguration.imsLibLocation();
          browserActions.injectAdobeIms(imsLibSrc, client);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.getReauthAccessToken();
          }, client);

          imsEvents = browserActions.getLocalStorageEvents(client.client_id);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.getProfile().then((v) => (window.onProfile = v));
          }, client);

          browser.waitUntil(() =>
            browser.execute(() => window && window.onProfile !== undefined)
          );

          assert(imsEvents.onReauthAccessToken === reauth);
          assert(imsEvents.onAccessToken && imsEvents.onReauthAccessToken);
        });

        it(`signOut${testNo}`, () => {
          browserActions.clearEvents();

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.signOut();
          }, client);

          browser.waitUntil(() =>
            browser.execute(() => window && window.document !== undefined)
          );

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken({});
          }, client);

          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onAccessTokenHasExpired"] !== undefined
          );

          const tokens = browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            const reauthoken = imsInstance.getReauthAccessToken();
            const accessToken = imsInstance.getAccessToken();

            return {
              reauthoken,
              accessToken,
            };
          }, client);

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(!tokens.reauthoken && !tokens.accessToken);

          assert(imsEvents.onReauthAccessToken === undefined);
          assert(imsEvents.onAccessTokenHasExpired === null);

        });
      });
    });
  });
});
