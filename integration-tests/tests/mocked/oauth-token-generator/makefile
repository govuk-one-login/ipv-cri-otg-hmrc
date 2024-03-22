STATE_MACHINE_NAME=oauth-token-generator
STATE_MACHINE_DEFINITION_FILE=file://../../../../step-functions/${STATE_MACHINE_NAME}.asl.json
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
	--state-machine ${STATE_MACHINE_ARN}#Happy \
	--input '{}' \
	--no-cli-pager

hmrcAPIFail:
	aws stepfunctions start-execution \
	--endpoint http://localhost:8083 \
	--name happyPathExecution \
	--state-machine ${STATE_MACHINE_ARN}#hmrcAPIFail \
	--input '{}' \
	--no-cli-pager
