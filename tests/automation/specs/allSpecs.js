// This file is the "test suite". We need it, so that all the tests would be run in a single browser/docker session
// especially on Jenkins. It speeds up the test execution significantly.
// Add all your specs which you want to be run with require('./specName')

require('./test');

require('./reauth');

require('./thin');

require('./multiple_clients');

require('./ride_error');

require('./switchProfile');

require('./test-modal');

require('./test-auth-code-modal');

require('./test-auth-code');



