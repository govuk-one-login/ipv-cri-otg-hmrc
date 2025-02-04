# di-ipv-cri-otg-hmrc

OAuth Token Generator for use with HMRC APIs

## Canaries
When deploying using sam deploy, canary deployment strategy will be used which is set in LambdaDeploymentPreference and StepFunctionsDeploymentPreference in template.yaml file.

When deploying using the pipeline, canary deployment strategy set in the pipeline will be used and override the default set in template.yaml.

Canary deployments will cause a rollback if any canary alarms associated with a lambda or step-functions are triggered and a slack notification will be sent to #di-orange-warnings-non-prod or #di-orange-warning-alerts-prod.

To skip canaries such as when releasing urgent changes to production, set the last commit message to contain either of these phrases: [skip canary], [canary skip], or [no canary] as specified in the [Canary Escape Hatch guide](https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3836051600/Rollback+Recovery+Guidance#Escape-Hatch%3A-how-to-skip-canary-deployments-when-needed).
`git commit -m "some message [skip canary]"`

Note: To update LambdaDeploymentPreference or StepFunctionsDeploymentPreference, update the LambdaCanaryDeployment or StepFunctionsDeploymentPreference pipeline parameter in the [identity-common-infra repository](https://github.com/govuk-one-login/identity-common-infra/tree/main/terraform/orange/hmrc-otg). To update the LambdaDeploymentPreference or StepFunctionsDeploymentPreference for a stack in dev using sam deploy, parameter override needs to be set in the [deploy script](./deploy.sh):

`--parameter-overrides LambdaDeploymentPreference=<define-strategy> \`
`--parameter-overrides StepFunctionsDeploymentPreference=<define-strategy> \`
