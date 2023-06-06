#!/usr/bin/env bash

set -x

npm run coverage-lcov
mkdir jidoka-unit
mv junitresults.xml jidoka-unit/TEST-unit-results.xml

npm run coverage-functional-lcov
mkdir jidoka-integration
mv junitresults.xml jidoka-integration/TEST-integration-results.xml