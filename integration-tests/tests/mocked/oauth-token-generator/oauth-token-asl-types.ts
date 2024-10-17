export interface ParallelState {
  Retry: [
    {
      ErrorEquals: string[];
      BackoffRate: number;
      MaxAttempts: number;
      IntervalSeconds: number;
    },
  ];
}
export interface StateMachineDefinition {
  States: {
    [stateName: string]: ParallelState;
  };
}
