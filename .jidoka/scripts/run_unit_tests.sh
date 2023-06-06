#!/usr/bin/env bash

set -x

npm run coverage

mkdir -p jidoka-unit/site/clover

mv coverage/* jidoka-unit/site/clover
mv junitresults.xml jidoka-unit/TEST-unit-results.xml

