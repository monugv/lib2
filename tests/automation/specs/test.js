const assert = require("assert");

const browserActions = require("../browser-actions/browser-actions.js");
const testConfiguration = require("../helpers/TestConfiguration");
const using = require("jasmine-data-provider");

const LoginService = require("../test-services/LoginService");

let browserUrl = "";
let imsLibSrc = "";

let testNo = 0;
testConfiguration.loadTestingEnvironment();

describe("Ims Automation tests", () => {
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

          const imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          assert(imsInstance !== null);
          assert(imsEvents.onReady === null);
        });

        it(`refresh token should fail because no token was previously aquired ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );

          browser.execute(() => {
            delete window["onError"];
            delete window["onAccessTokenHasExpired"];
            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken({});
          }, client);
          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onAccessTokenHasExpired"] !== undefined
          );

          imsEvents = browserActions.getLocalStorageEvents(client.client_id);

          assert(!imsEvents.onAccessToken);
        });

        it(`validate token should throw exception if not logged ${testNo}`, () => {
          browser.execute(() => {
            delete window["onTokenValidation"];
            let imsInstance = window["adobeIMS"];
            imsInstance
              .validateToken()
              .catch((value) => (window["onTokenValidation"] = value));
          }, client);

          browser.waitUntil(() =>
            browser.execute(
              () => window && window["onTokenValidation"] !== undefined
            )
          );
          const validationValue = browser.execute(() => {
            return window["onTokenValidation"];
          }, client);

          expect(validationValue).toEqual(false);
        });

        it(`sign in ${testNo}`, () => {
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signIn({}, 5);
          }, client);

          LoginService.fillAccountCredentials(account);

          $(".automationbody").waitForExist();

          browserActions.injectAdobeIms(imsLibSrc, client);

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

        it(`user is signed in ${testNo}`, () => {
          const signInResponse = browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            return imsInstance.isSignedInUser();
          }, client);

          assert(signInResponse === true);
        });

        it(`getTransitoryAuthorizationCode ${testNo}`, () => {
          browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getTransitoryAuthorizationCode().then((v) => {
              window.tac = v;
            });
          }, client);

          browser.waitUntil(() =>
            browser.execute(() => window && window.tac !== undefined && window.tac.code !== undefined)
          );
        });

        it(`validate token should return true if logged ${testNo}`, () => {
          browser.execute(() => {
            delete window["onTokenValidation"];
            let imsInstance = window["adobeIMS"];
            imsInstance
              .validateToken()
              .then((value) => (window["onTokenValidation"] = value));
          }, client);

          browser.waitUntil(() =>
            browser.execute(
              () => window && window["onTokenValidation"] !== undefined
            )
          );
          const validationValue = browser.execute(() => {
            return window["onTokenValidation"];
          }, client);

          expect(validationValue).toEqual(true);
        });

        it(`should get Access Token ${testNo}`, () => {
          const tokenResponse = browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            return imsInstance.getAccessToken();
          }, client);

          assert(tokenResponse !== null);
        });

        it(`should call the refresh token ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );
          const tokenBeforeRefresh = imsEvents.onAccessToken;

          browserActions.clearEvents();

          browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            imsInstance.refreshToken();
          }, client);

          browserActions.waitForClientEvent(
            "IMSLibJSTestClient",
            (obj) => obj["onAccessToken"] !== undefined
          );

          imsEvents = browserActions.getLocalStorageEvents(client.client_id);

          assert(imsEvents.onAccessToken !== null);
          assert(imsEvents.onAccessToken !== tokenBeforeRefresh);
        });

        it(`new browser tab and check the token ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
            client.client_id
          );
          const accessToken = imsEvents.onAccessToken;

          if (!accessToken) {
            //has no point to make the test if before test failed "should call the refresh token"
            return fail;
          }
          browserUrl = testConfiguration.environmentUrl();

          browser.newWindow(browserUrl, "Testing window");

          imsLibSrc = testConfiguration.imsLibLocation();
          browserActions.injectAdobeIms(imsLibSrc, client);

          const tokenInfo = browser.execute(() => {
            const imsInstance = window["adobeIMS"];

            return imsInstance.getAccessToken();
          }, client);

          imsEvents = browserActions.getLocalStorageEvents(client.client_id);
          browser.execute(() => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getProfile().then(profile => {
              window.newtabprofile = profile;
            });
          }, client);

          browser.waitUntil(() =>
            browser.execute(() => window && window.newtabprofile !== undefined && window.newtabprofile.userId !== undefined)
          );

          expect(tokenInfo).not.toBeNull();

          assert(
            imsEvents.onReauthAccessToken === undefined &&
              imsEvents.onAccessToken &&
              imsEvents.onAccessToken.token === accessToken.token
          );
        });

        it(`getTokenForPBAPolicy when no current satisfied policies ${testNo}`, () => {
          let imsEvents = browserActions.getLocalStorageEvents(
              client.client_id
          );
          const tokenBeforeRefresh = imsEvents.onAccessToken;

          browserActions.clearEvents();

          browser.execute(  () => {
            const imsInstance = window["adobeIMS"];
            imsInstance.getTokenForPBAPolicy( "MedSec" );
          }, client );

          browserActions.waitForClientEvent(
              "IMSLibJSTestClient",
              ( obj ) => obj["onAccessToken"] !== undefined
          );

          const tokenInfo = browser.execute(   () => {
            const imsInstance = window["adobeIMS"];
            return imsInstance.getAccessToken();
          }, client );

          assert( tokenInfo.pbaSatisfiedPolicies.includes('MedSec'));

          imsEvents = browserActions.getLocalStorageEvents( client.client_id );

          assert( imsEvents.onAccessToken !== null );
          assert( imsEvents.onAccessToken !== tokenBeforeRefresh );
        });

        it(`getTokenForPBAPolicy when current satisfied policies contain desired one${testNo}`, () => {
          browserActions.clearEvents();

          browser.execute(  () => {
            const imsInstance = window["adobeIMS"];
            return imsInstance.getTokenForPBAPolicy( "LowSec" )
                .then( (v) => {
                  window.tokenInfo = v;
                } );
            }, client );

          browser.waitUntil(() =>
              browser.execute(() => window && window.tokenInfo !== undefined)
          );

          const tokenInfo = browser.execute(() => {
            return window.tokenInfo;
          })

          assert( tokenInfo.pbaSatisfiedPolicies.includes('LowSec'));
          let imsEvents = browserActions.getLocalStorageEvents( client.client_id );

          assert( imsEvents === null );
        });

        it(`signOut${testNo}`, () => {
          browserActions.clearEvents();

          browser.execute(() => {
            delete window["onAccessTokenHasExpired"];
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

        it(`sign up ${testNo}`, () => {
          browser.execute(() => {
            let imsInstance = window["adobeIMS"];
            imsInstance.signUp({});
          }, client);

          $("[data-id='Signup-CreateAccountBtn']").waitForExist();
        });
      });
    });
  });
});
