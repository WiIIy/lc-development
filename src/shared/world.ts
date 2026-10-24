import { world as World } from "@rbxts/jecs";
import Replecs from "@rbxts/replecs";

const world = World();
export const replicator = Replecs.create(world);

export default world;
