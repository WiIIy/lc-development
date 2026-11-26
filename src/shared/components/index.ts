//src/shared/components/index.ts
import { Entity, Name } from "@rbxts/jecs";
import { HttpService } from "@rbxts/services";
import world from "../world";
import { CoreComponents } from "./core";
import { PlayerComponents } from "./player";
import { ItemComponents } from "./items";
import { AIComponents } from "./npc";
import { CombatComponents } from "./npccombat";
import { setSerdes } from "shared/utils/ecs/componentUtil";

export const Components = {
	...CoreComponents,
	...PlayerComponents,
	...ItemComponents,
	...AIComponents,
	...CombatComponents,
};

for (const [key, value] of pairs(Components)) {
	if (typeIs(value, "number")) {
		world.set(value as Entity, Name, string.lower(key));
	}
}

setSerdes(Components.Transform, {
	bytespan: 12,
	serialize: (transform) => {
		const buff = buffer.create(12);
		buffer.writef32(buff, 0, transform.X);
		buffer.writef32(buff, 4, transform.Y);
		buffer.writef32(buff, 8, transform.Z);
		return buff;
	},
	deserialize: (buff) => new CFrame(buffer.readf32(buff, 0), buffer.readf32(buff, 4), buffer.readf32(buff, 8)),
});

setSerdes(Components.ActiveStatusEffects, {
	serialize: (debuffs: StatusEffect[]) => {
		const json = HttpService.JSONEncode(debuffs);
		const buff = buffer.create(json.size());
		buffer.writestring(buff, 0, json);
		return buff;
	},
	deserialize: (buff: buffer) => {
		const json = buffer.readstring(buff, 0, buffer.len(buff));
		return HttpService.JSONDecode(json) as StatusEffect[];
	},
});

export type ComponentsMap = typeof Components;
export default Components;