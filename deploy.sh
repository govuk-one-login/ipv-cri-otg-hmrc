#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")/infrastructure"
set -eu

stack_name=${1:-${STACK_NAME:-}}

if ! [[ $stack_name ]]; then
  [[ $(aws sts get-caller-identity --query Arn --output text) =~ \/([^\/\.]+)\. ]] && user=${BASH_REMATCH[1]} || exit
  stack_name="$user-otg-hmrc"
  echo "» Using stack name '$stack_name'"
fi

export AWS_DEFAULT_REGION=${AWS_REGION:-eu-west-2}

sam validate -t template.yaml
sam validate -t template.yaml --lint

sam build -t template.yaml --cached --parallel

if status=$(aws cloudformation describe-stacks --stack-name "$stack_name" \
  --query "Stacks[0].StackStatus" --output text 2> /dev/null) && [[ $status =~ _FAILED ]]; then
  echo "» Deleting stack $stack_name in a failed state"
  sam delete --no-prompts --stack-name "$stack_name"
fi

sam deploy --stack-name "$stack_name" \
  --no-fail-on-empty-changeset \
  --no-confirm-changeset \
  --resolve-s3 \
  --s3-prefix "$stack_name" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --tags \
  cri:component=ipv-cri-otg-hmrc \
  cri:stack-type=dev \
  cri:application=Orange \
  cri:deployment-source=manual \
  --parameter-overrides \
  Environment=dev
