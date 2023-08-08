export interface OAuthEvent {
  oAuthURL: {
    value: string;
  };
  totp: string;
  clientSecret: {
    value: string;
  };
  clientId: {
    value: string;
  };
}
