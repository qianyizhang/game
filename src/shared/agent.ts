/** Transport shapes only. Observation, legality and rewards belong to each game. */
export interface AgentAction<C> {
  id: string;
  command: C;
}
export interface AgentFrame<O, C> {
  protocol: 'card-workshop.agent.v1';
  game: string;
  step: number;
  observation: O;
  actions: AgentAction<C>[];
}
export interface AgentChoice {
  step: number;
  action: string;
}
