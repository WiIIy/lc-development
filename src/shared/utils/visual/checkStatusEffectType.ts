import { ALL_DEBUFFS, ALL_BUFFS } from "shared/data/status/status";

export function checkStatusEffectType(id: string): "debuff" | "buff" {
	if (ALL_DEBUFFS.includes(id)) {
		return "debuff";
	} else if (ALL_BUFFS.includes(id)) {
		return "buff";
	} else {
		return "buff"; //whatever
	}
}
