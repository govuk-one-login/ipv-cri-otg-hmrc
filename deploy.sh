#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")"
set -eu

template=infrastructure/template.yaml
stack_name="${1:-}"

if ! [[ "$stack_name" ]]; then
  [[ $(aws sts get-caller-identity --query Arn --output text) =~ \/([^\/\.]+)\. ]] && user="${BASH_REMATCH[1]}" || exit
  stack_name="$user-otg-hmrc"
  echo "» Using stack name '$stack_name'"
fi

sam validate --template $template
sam validate --template $template --lint

sam build --template $template --cached --parallel

sam deploy --stack-name "$stack_name" \
  --no-fail-on-empty-changeset \
  --no-confirm-changeset \
  --resolve-s3 \
  --s3-prefix "$stack_name" \
  --region "${AWS_REGION:-eu-west-2}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --tags \
  cri:component=ipv-cri-otg-hmrc \
  cri:stack-type=localdev \
  cri:application=Orange \
  cri:deployment-source=manual
