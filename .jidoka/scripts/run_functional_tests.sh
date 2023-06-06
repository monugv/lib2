#!/usr/bin/env bash

set -x

npm run coverage-functional

mkdir -p jidoka-integration/site/clover

mv coverage-functional/* jidoka-integration/site/clover
mv junitresults.xml jidoka-integration/TEST-integration-results.xml