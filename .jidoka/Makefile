SHELL:=/bin/bash

# To run the full jidoka build ignoring coverage errors, use:
#   make -i jidoka
#
# The targets are intentionally not chained together as they run in seperate
# processes when invoked by the Jidoka build jobs.

# Configuration variables at build time, set now at execution time
pwd := $(shell pwd)

JIDOKA_GIT_REPO := ".git"
JIDOKA_BASE_BRANCH := $(or $(BASE_BRANCH), "master")

$(info [JIDOKA] Configuring Jidoka Makefile build ...)
$(info [JIDOKA] JIDOKA_GIT_REPO=$(JIDOKA_GIT_REPO))
$(info [JIDOKA] JIDOKA_BASE_BRANCH=$(JIDOKA_BASE_BRANCH))

# Configuration variables at runtime, executed when used
JIDOKA_COVERAGE_TARGET_UNIT = $(or $(TARGET_COVERAGE_UNIT), 60)
JIDOKA_COVERAGE_TARGET_INTEGRATION = $(or $(TARGET_COVERAGE_INTEGRATION), 60)
JIDOKA_COVERAGE_TARGET_COMBINED = $(or $(TARGET_COVERAGE), 80)
JIDOKA_UNIT_TEST_REPORTS = $(or $(UNIT_TEST_REPORTS), "target/jidoka-unit")
JIDOKA_INTEGRATION_TEST_REPORTS = $(or $(INTEGRATION_TEST_REPORTS), "target/jidoka-integration")

# Sonar/Github import variables at runtime, executed when used
JIDOKA_SONAR_URL = $(or $(SONAR_HOST_URL), "https://ims.cq.corp.adobe.com")
JIDOKA_SONAR_PROJECT_KEY = $(or $(SONAR_PROJECT_KEY), "com.adobe.hs:imslib2.js")
JIDOKA_SONAR_LOGIN = $(or $(SONAR_LOGIN), "UNSET_SONAR_LOGIN")

JIDOKA_GITHUB_ENDPOINT := $(or $(GITHUB_ENDPOINT), "https://git.corp.adobe.com/api/v3/")
JIDOKA_GITHUB_ORG := $(or $(GITHUB_ORG), "IMS")
JIDOKA_GITHUB_REPO := $(or $(GITHUB_REPO), "imslib2.js")
JIDOKA_GITHUB_ACCESS_TOKEN = $(or $(GITHUB_ACCESS_TOKEN), "UNSET_GITHUB_ACCESS_TOKEN_ENVIRONMENT_VARIABLE")
JIDOKA_GITHUB_PR_NUMBER = $(or $(GITHUB_PR_NUMBER), "UNSET_GITHUB_PR_NUMBER_ENVIRONMENT_VARIABLE")
JIDOKA_GITHUB_BRANCH = $(or $(COVERAGE_TEMP_BRANCH), $(or $(CHANGE_BRANCH), $(shell git rev-parse --abbrev-ref HEAD)))

JIDOKA_GIT_REVISION = $(or $(GITHUB_REVISION), $(shell git rev-parse origin/$(call JIDOKA_GITHUB_BRANCH)))

# Combination commands
jidoka: jidoka-clean jidoka-build jidoka-static-analysis jidoka-unit jidoka-unit-coverage jidoka-integration jidoka-integration-coverage jidoka-combined-coverage

jidoka-clean:
	# nop

jidoka-static-analysis:
	sonar-scanner \
		-Dsonar.host.url=$(JIDOKA_SONAR_URL) \
		-Dsonar.login=$(JIDOKA_SONAR_LOGIN) \
		-Dsonar.projectKey="$(JIDOKA_SONAR_PROJECT_KEY)" \
		-Dsonar.pullrequest.github.endpoint=$(JIDOKA_GITHUB_ENDPOINT) \
		-Dsonar.pullrequest.github.repository=$(JIDOKA_GITHUB_ORG)/$(JIDOKA_GITHUB_REPO) \
		-Dsonar.pullrequest.base="$(JIDOKA_BASE_BRANCH)" \
		-Dsonar.pullrequest.branch="$(JIDOKA_GITHUB_BRANCH)" \
		-Dsonar.pullrequest.key=$(JIDOKA_GITHUB_PR_NUMBER) \
		-Dsonar.scm.revision="$(JIDOKA_GIT_REVISION)" \
		-Dsonar.analysis.git.project.org=$(JIDOKA_GITHUB_ORG) \
		-Dsonar.analysis.git.project.repo=$(JIDOKA_GITHUB_REPO) \
		-Dsonar.sources="src"

jidoka-build:
	bash .jidoka/scripts/build.sh

jidoka-unit: # requires - jidoka-clean jidoka-build
	bash .jidoka/scripts/run_unit_tests.sh

jidoka-unit-coverage: # requires - jidoka-clean jidoka-build jidoka-unit
	$(info [JIDOKA] COVERAGE_BRANCH=$(JIDOKA_GITHUB_BRANCH))
	npm run jidoka -- pr-coverage \
		gitRepo=$(JIDOKA_GIT_REPO) \
		baseBranch=$(JIDOKA_BASE_BRANCH) \
		changesBranch=$(JIDOKA_GITHUB_BRANCH) \
		requiredCoverage=$(JIDOKA_COVERAGE_TARGET_UNIT) \
		coverageReports='jidoka-unit/**/clover.xml' \
		result='jidoka-unit/unit-coverage.json'

jidoka-integration: # requires - jidoka-clean jidoka-build
	bash .jidoka/scripts/run_functional_tests.sh

jidoka-integration-coverage: # requires - jidoka-clean jidoka-build jidoka-integration
	$(info [JIDOKA] COVERAGE_BRANCH=$(JIDOKA_GITHUB_BRANCH))
	npm run jidoka -- pr-coverage \
		gitRepo=$(JIDOKA_GIT_REPO) \
		baseBranch=$(JIDOKA_BASE_BRANCH) \
		changesBranch=$(JIDOKA_GITHUB_BRANCH) \
		requiredCoverage=$(JIDOKA_COVERAGE_TARGET_UNIT) \
		coverageReports='jidoka-integration/**/clover.xml' \
		result='jidoka-integration/integration-coverage.json'

jidoka-combined-coverage: # requires - jidoka-clean jidoka-build jidoka-unit jidoka-integration
	npm run jidoka -- pr-coverage \
		gitRepo=$(JIDOKA_GIT_REPO) \
		baseBranch=$(JIDOKA_BASE_BRANCH) \
		changesBranch=$(JIDOKA_GITHUB_BRANCH) \
		requiredCoverage=$(JIDOKA_COVERAGE_TARGET_UNIT) \
		coverageReports='**/clover.xml' \
		result='combined-coverage.json'

jidoka-analysis-project: # requires - jidoka-clean jidoka-build jidoka-unit jidoka-integration
	bash .jidoka/scripts/build.sh
	bash .jidoka/scripts/run_project_analysis_tests.sh

	$(info [Jidoka] Result publishing to Sonar disabled during the migration to Sonarqube server version 8)
	sonar-scanner \
		-Dsonar.host.url=$(JIDOKA_SONAR_URL) \
		-Dsonar.login=$(JIDOKA_SONAR_LOGIN) \
		-Dsonar.projectKey="$(JIDOKA_SONAR_PROJECT_KEY)" \
		-Dsonar.sources="src" \
		-Dsonar.analysis.git.project.org=$(JIDOKA_GITHUB_ORG) \
		-Dsonar.analysis.git.project.repo=$(JIDOKA_GITHUB_REPO) \
		-Dsonar.typescript.lcov.reportPaths="coverage/lcov.info,coverage-functional/lcov.info"