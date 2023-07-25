import { LambdaInterface } from "@aws-lambda-powertools/commons";

export class BearerTokenHandler implements LambdaInterface {
  public async handler(
    event: any,
    _context: unknown
  ): Promise<any> {
    const url = event.oAuthURL.value;
    const data = {
      client_secret: event.totp + event.clientSecret.value,
      client_id: event.clientId.value,
      grant_type: "client_credentials"
    } as Record<string, string>;

    const formBody = Object.keys(data).map(key => 
      encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
    ).join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: formBody
    });

    const body = await response.json();

    return {
      token: body.access_token, 
      tokenExpiry: (Date.now() + (body.expires_in*1000)).toString()
    }
  }
}

const handlerClass = new BearerTokenHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);