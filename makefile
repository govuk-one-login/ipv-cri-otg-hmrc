ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
STATE_MACHINE_NAME=pdpOtgStateMachine
STATE_MACHINE_DEFINITION_FILE=file://statemachine/${STATE_MACHINE_NAME}.json
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