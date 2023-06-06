const {ReportAggregator, HtmlReporter} = require('@rpii/wdio-html-reporter');
const HtmlReporterPath = process.env.TEST_CREDENTIALS ? process.env.TEST_CREDENTIALS : 'default';

exports.config = {
    debug: true,
    execArgv: ['--inspect=127.0.0.1:5859'], //needed for the node inspector to attach to the wdio process
    
    specs: [
        'specs/allSpecs.js'
    ],
    maxInstances: 2,
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            // to run chrome headless the following flags are required
            // (see https://developers.google.com/web/updates/2017/04/headless-chrome)
            // https://github.com/RobCherry/docker-chromedriver/issues/15
            // https://stackoverflow.com/questions/57463616/disable-dev-shm-usage-does-not-resolve-the-chrome-crash-issue-in-docker
            // https://www.intricatecloud.io/2019/05/running-webdriverio-tests-using-headless-chrome-inside-a-container/
            args: [
                '--headless',
                '--no-sandbox',
                '--disable-infobars',
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
                '--whitelisted-ips='
            ],
        }
    }],
    // Level of logging verbosity: trace | debug | info | warn | error
    logLevel: 'error',
    // Warns when a deprecated command is used
    deprecationWarnings: true,
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'https://webdriver.io',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 900000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    services: ['selenium-standalone'],
    //
    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 999999
    },
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: ['spec', [HtmlReporter, {
            debug: true,
            outputDir: './reports/' + HtmlReporterPath + '/html-reports/',
            filename: 'report.html',
            reportTitle: 'PullRequest Report',
            showInBrowser: false,
            useOnAfterCommandForScreenshot: false,
        }
    ]],
    
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    before() {
        
    },

    onPrepare: function (config, capabilities) {
        let reportAggregator = new ReportAggregator({
            outputDir: './reports/' + HtmlReporterPath + '/html-reports/',
            filename: 'master-report.html',
            reportTitle: 'Master Report',
        });
        reportAggregator.clean();
        global.reportAggregator = reportAggregator;
    },

    onComplete: function(exitCode, config, capabilities, results) {
        (async () => {
            await global.reportAggregator.createReport( {
                config: config,
                capabilities: capabilities,
                results : results
            });
        })();
    },
};
