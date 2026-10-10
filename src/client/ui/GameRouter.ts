import { createProducer } from "@rbxts/reflex";

export namespace GameRouter {
	export interface GameState {
		releaseType: "dev" | "testing" | "release";
		version: string;
	}

	export const gameProducer = createProducer({
		releaseType: "dev",
		version: "0.1.0",
	} satisfies GameState as GameState, {});
}
