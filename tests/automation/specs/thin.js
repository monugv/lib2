
const assert = require('assert');

const browserActions = require('../browser-actions/browser-actions.js');
const testConfiguration = require('../helpers/TestConfiguration');

const using = require('jasmine-data-provider');

const LoginService = require('../test-services/LoginService');

let browserUrl = '';
let imsThinLibSrc = '';

let testNo = 0;
testConfiguration.loadTestingEnvironment();

describe('Ims Automation tests for thin library', () => {

    using(testConfiguration.testingScenarios(), (scenario) => {

        using(scenario.accounts, (account) => {

            using(scenario.clients, (client) => {
                testNo++;

                it(`navigate to next test`, () => {
                    browserUrl = testConfiguration.environmentUrl();
                    imsThinLibSrc = testConfiguration.imsLibLocation(true);

                    browser.reloadSession();

                    browser.url(browserUrl);
                    $('.automationbody').waitForExist();

                    browserActions.clearEvents();
                    browserActions.injectAdobeImsNotReady(imsThinLibSrc, client);

                    browser.waitUntil(() => browser.execute(() => window && window.document !== undefined && window['adobeIMS'] !== undefined ));

                    const imsInstance = browserActions.getAdobeImsInstance();
                    assert(imsInstance !== null);
                });

                it(`signIn ${testNo}`, () => {

                    browserActions.clearEvents();

                    browser.execute(() => {
                        const imsInstance = window['adobeIMS'];

                        imsInstance.signIn();
                    }, client);

                    LoginService.fillAccountCredentials(account);

                    browser.waitUntil(() => browser.execute(() => window && window.document !== undefined));

                    $('.automationbody').waitForExist();

                    browserActions.injectAdobeImsNotReady(imsThinLibSrc, client);

                    const fragmentValues = browser.execute(() => {
                        const imsInstance = window['adobeIMS'];

                        return imsInstance.fragmentValues();
                    }, client);

                    assert(fragmentValues !== undefined && fragmentValues.access_token.length > 1);

                });

                it(`signOut ${testNo}`, () => {

                    browserActions.clearEvents();

                    browser.execute(() => {
                        const imsInstance = window['adobeIMS'];

                        imsInstance.signOut('token');
                    }, client);

                    $('.automationbody').waitForExist();

                    browserActions.injectAdobeImsNotReady(imsThinLibSrc, client);

                    const fragmentValues = browser.execute(() => {
                        const imsInstance = window['adobeIMS'];

                        return imsInstance.fragmentValues();
                    }, client);

                    assert(fragmentValues !== undefined && fragmentValues.api === 'logout');

                });

            });
        });
    });

});
