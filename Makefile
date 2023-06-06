SHELL:=/bin/bash

# The targets are intentionally not chained together as they run in seperate
# processes when invoked by the IMS Pipelines build jobs.

# Configuration variables at build time, set now at execution time
pwd := $(shell pwd)

XLINE_GIT_REPO := ".git"
XLINE_BASE_BRANCH := $(or $(BASE_BRANCH), "master")

$(info [XLINE] Configuring IMS Pipelines Makefile build ...)
$(info [XLINE] XLINE_GIT_REPO=$(XLINE_GIT_REPO))
$(info [XLINE] XLINE_BASE_BRANCH=$(XLINE_BASE_BRANCH))

XLINE_ARTIFACTORY_USER = $(or $(ARTIFACTORY_USER), "UNSET_ARTIFACTORY_USER")
XLINE_ARTIFACTORY_PASSWORD = $(or $(ARTIFACTORY_API_TOKEN), "UNSET_ARTIFACTORY_PASSWORD")

# Combination commands
xline: xline-debug xline-artifactory-login xline-clean xline-preinstall xline-build xline-typedoc xline-publish-artifactory xline-publish-tessa xline-run-tests xline-run-tests-stage xline-run-tests-prod

xline-debug:
	npm -v && node -v

xline-artifactory-login:
	curl -sS -u $(XLINE_ARTIFACTORY_USER):$(XLINE_ARTIFACTORY_PASSWORD) https://artifactory.corp.adobe.com/artifactory/api/npm/npm-jidoka-snapshot/auth/jidoka > .npmrc
	curl -sS -u $(XLINE_ARTIFACTORY_USER):$(XLINE_ARTIFACTORY_PASSWORD) https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/adobe >> .npmrc
	curl -sS -u $(XLINE_ARTIFACTORY_USER):$(XLINE_ARTIFACTORY_PASSWORD) https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/identity > demo-apps/react/.npmrc

xline-clean:
	# nop

xline-preinstall:
	npm ci
	npm --prefix tests/automation ci

xline-build:
	npm run build > npmBuild.log

xline-typedoc:
	npm run typedoc

xline-publish-artifactory:
	npm run artefactbuild
	curl -sS -u ${XLINE_ARTIFACTORY_USER}:${XLINE_ARTIFACTORY_PASSWORD} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/identity > ./artefacts/imslib/.npmrc
	curl -sS -u ${XLINE_ARTIFACTORY_USER}:${XLINE_ARTIFACTORY_PASSWORD} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/identity > ./artefacts/imslib-polyfill/.npmrc
	curl -sS -u ${XLINE_ARTIFACTORY_USER}:${XLINE_ARTIFACTORY_PASSWORD} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/identity > ./artefacts/imslib-thin/.npmrc
	curl -sS -u ${XLINE_ARTIFACTORY_USER}:${XLINE_ARTIFACTORY_PASSWORD} https://artifactory.corp.adobe.com/artifactory/api/npm/npm-adobe-release/auth/identity > ./artefacts/imslib-thin-polyfill/.npmrc
	npm run publish-artefact

xline-publish-tessa:
	npm run tessa

xline-run-tests:
	npm run start-automatedtest

xline-run-tests-stage:
	npm run start-automatedtest:stage

xline-run-tests-prod:
	npm run start-automatedtest:prod