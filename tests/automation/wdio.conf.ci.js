// wdio.conf.ci.js
var merge = require('deepmerge');
var wdioConf = require('./wdio.conf.js');

// have main config file as default but overwrite environment specific information
exports.config = merge(wdioConf.config, {

    host: 'localhost',
    port: 4444,
    path: '/wd/hub',

    after: function (result, capabilities, specs) {
        // this "lets zalenium know" if the test was passed or failed.
        let cookie;
        result === 0 ? cookie = { name: 'zaleniumTestPassed', value: 'true' } : cookie = { name: 'zaleniumTestPassed', value: 'false' };
        browser.setCookie(cookie);
    },

    name: process.env._NAME || 'Your-project-name-here'
});

// add an additional reporter
exports.config.reporters.push('junit','allure-addons');
exports.config.services.splice(0,1);