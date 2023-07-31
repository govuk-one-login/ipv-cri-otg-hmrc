#!/usr/bin/env bash
set -e

RED="\033[1;31m"
GREEN="\033[1;32m"
NOCOLOR="\033[0m"

stack_name="$1"


if [ -z "$stack_name" ]
then
echo -e "😱 ${RED}stack name expected as first argument, e.g. ${GREEN}./deploy.sh common-lambdas-my-name${NOCOLOR}"
exit 1
fi


echo -e "👉 deploying common lambdas with:"
echo -e "\tstack name: ${GREEN}$stack_name${NOCOLOR}"

sam validate -t infrastructure/template.yaml
sam build -t infrastructure/template.yaml
sam deploy --stack-name "$stack_name" \
   --no-fail-on-empty-changeset \
   --no-confirm-changeset \
   --resolve-s3 \
   --region eu-west-2 \
   --capabilities CAPABILITY_IAM \
   --parameter-overrides \
   CodeSigningEnabled=false \
   Environment=dev \
