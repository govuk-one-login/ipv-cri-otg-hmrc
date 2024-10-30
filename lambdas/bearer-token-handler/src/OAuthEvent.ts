export interface OAuthEvent {
  stackName: string;
  tokenType: string;
  oAuthURL: {
    value: string;
  };
}
