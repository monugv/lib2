#!/usr/bin/env bash

set -x

git checkout -- .npmrc

curl -s -u ${ARTIFACTORY_USER}:${ARTIFACTORY_API_TOKEN} https://artifactory.corp.adobe.com/artifactory/api/npm/auth >> .npmrc

npm ci
npm run build
npm run eslint