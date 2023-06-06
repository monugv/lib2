#!/bin/bash

set -x

VERSION=$(date +"%Y_%m_%d_%H_%M")

docker build -t imslib2-jidoka .

IMAGE_ID=$(docker images --filter=reference=imslib2-jidoka:latest --format "{{.ID}}")
echo "Image id to deploy: $IMAGE_ID"

docker tag "$IMAGE_ID" docker-tide-release.dr.corp.adobe.com/imslib2-jidoka:"$VERSION"
echo "Tagged new image version: $VERSION"

docker login -u "$ARTIFACTORY_USER" -p "$ARTIFACTORY_API_TOKEN" docker-tide-release.dr.corp.adobe.com

docker push docker-tide-release.dr.corp.adobe.com/imslib2-jidoka:"$VERSION"
echo "Deployed image: docker-tide-release.dr.corp.adobe.com/imslib2-jidoka:$VERSION"
