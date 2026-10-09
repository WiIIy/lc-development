import Replecs from "@rbxts/replecs";
import { Name } from "@rbxts/jecs";
import world from "../world";
import Components from "./components";

// Create a table with all your components
const shared_components = {
	// foo: world.component<unknown>(),
	// baz: world.entity(),
	// test: Components.Test,
	// transform: Components.Transform,
	// animator: Components.Animator, //not replicated due to different animator instances for viewmodel and character
	// animationqueue: Components.AnimationQueue,
	player: Components.Player,
	currentlyEquipped: Components.CurrentlyEquipped,
	blood: Components.Blood,
	health: Components.Health,
	stamina: Components.Stamina,
	activeStatusEffects: Components.ActiveStatusEffects,
};

// Mark each component as shared and set its name
for (const [name, component] of pairs(shared_components)) {
	world.set(component, Name, name as string);
	world.add(component, Replecs.shared);
}

export default shared_components;
