export interface ClientState {
	// Add client-specific state properties here
}

export interface ServerState {
	// Add server-specific state properties here
}

export interface SharedState {
	// Add shared state properties here
}

export type State = (ClientState & SharedState) | (ServerState & SharedState) | SharedState;

export const State = {} as State;
