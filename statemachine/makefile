ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
STATE_MACHINE_NAME=pdpOtgStateMachine
STATE_MACHINE_DEFINITION_FILE=file://${STATE_MACHINE_NAME}.json
STATE_MACHINE_ARN=arn:aws:states:local:123456789012:stateMachine:${STATE_MACHINE_NAME}
STATE_MACHINE_EXECUTION_ARN=arn:aws:states:local:123456789012:execution:${STATE_MACHINE_NAME}

run:
	docker compose up -d --force-recreate
create:
	aws stepfunctions create-state-machine \
	--endpoint-url http://localhost:8083 \
	--definition ${STATE_MACHINE_DEFINITION_FILE} \
	--name ${STATE_MACHINE_NAME} \
	--role-arn "arn:aws:iam::123456789012:role/DummyRole" \
	--no-cli-pager
happy:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name happyPathExecution \
	--state-machine ${STATE_MACHINE_ARN}#HappyPathTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager 
happy-h:
	aws stepfunctions get-execution-history \
	--endpoint http://localhost:8083 \
	--execution-arn ${STATE_MACHINE_EXECUTION_ARN}:happyPathExecution  \
	--query 'events[?type==`TaskStateExited` && stateExitedEventDetails.name==`Put OauthAccessTokenExpiry`]' \
	--no-cli-pager
TotpSecretResourceNotFound:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name TotpSecretResourceNotFoundUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#TotpSecretResourceNotFoundUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
TotpSecretPermissionsError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name TotpSecretPermissionsErrorUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#TotpSecretPermissionsErrorUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
ClientSecretResourceNotFound:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name ClientSecretResourceNotFoundExecution \
	--state-machine ${STATE_MACHINE_ARN}#ClientSecretResourceNotFoundUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
ClientSecretPermissionsError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name ClientSecretPermissionsErrorUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#ClientSecretPermissionsErrorUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
ClientIdParameterResourcePermissionsError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name ClientIdParameterResourcePermissionUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#ClientIdParameterResourcePermissionUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
OAuthURLParameterResourcePermissionError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name OAuthURLParameterResourcePermissionUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#OAuthURLParameterResourcePermissionUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
OAuthURLParameterResourceNotFound:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name OAuthURLParameterResourceNotFoundExecution \
	--state-machine ${STATE_MACHINE_ARN}#OAuthURLParameterResourceNotFoundUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
PutOAuthAccessTokenExpiryPermissionError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name PutOAuthAccessTokenExpiryPermissionUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#PutOAuthAccessTokenExpiryPermissionUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
PutOAuthAccessTokenSecretPermissionError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name PutOAuthAccessTokenSecretPermissionUnHappyExecution \
	--state-machine ${STATE_MACHINE_ARN}#PutOAuthAccessTokenSecretPermissionUnHappyTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
GenerateTotpCodeFailedDueToInValidSecretLength:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name GenerateTotpCodeFailedDueToInValidSecretLengthExecution \
	--state-machine ${STATE_MACHINE_ARN}#GenerateTotpCodeFailedDueToInValidSecret \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
GenerateTotpCodeFailedDueToSecretAbsent:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name GenerateTotpCodeFailedDueToSecretAbsentExecution \
	--state-machine ${STATE_MACHINE_ARN}#GenerateTotpCodeFailedDueToSecretAbsentTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager
GenerateOAuthTokenFailedDueToServerError:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name GenerateOAuthTokenFailedDueToServerExecution \
	--state-machine ${STATE_MACHINE_ARN}#GenerateOAuthTokenFailedDueToServerErrorTest \
	--input file://events/sfn_valid_input.json \
	--no-cli-pager