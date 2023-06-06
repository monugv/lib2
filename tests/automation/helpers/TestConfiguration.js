
const scenarioData = require('../test-data/scenarios.js');

const APP_URL = 'https://localhost.corp.adobe.com:9000';

const ENVIRONMENTS = {
    local: 'local',
    stage: 'stg1',
    prod: 'prod'
};

let testingScenarios = [];
let environment = 0;

module.exports = {
    ENVIRONMENTS,
    loadTestingEnvironment: () => {
        const { TEST_CREDENTIALS, TEST_ENV = ENVIRONMENTS.local } = process.env;
        const stageOrProdScenarioKey = TEST_CREDENTIALS.trim();
        environment = TEST_ENV;
        testingScenarios = scenarioData[stageOrProdScenarioKey];

        return stageOrProdScenarioKey;
    },
    imsLibLocation: (useThin = false) => {
        const imsLibraryName = useThin? 'imslib-thin.min.js': 'imslib.min.js';

        if(environment === ENVIRONMENTS.local) {
            return `${APP_URL}/release/${imsLibraryName}`;
        }

        if(environment === ENVIRONMENTS.stage) {
            return `https://auth-stg1.services.adobe.com/imslib/${imsLibraryName}`;
        }

        return `https://auth.services.adobe.com/imslib/${imsLibraryName}`;
    },
    environmentUrl: () => `${APP_URL}`,
    testingScenarios: () => testingScenarios,
}
