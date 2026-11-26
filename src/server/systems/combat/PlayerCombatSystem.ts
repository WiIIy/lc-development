// Server upkeep for player melee: safety expiry, parry lockout, and telling the client what it holds.
//src/server/systems/combat/PlayerCombatSystem.ts
import { pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { forceEndBlock, getEquippedId, isBlocking } from "shared/utils/combat/playerCombat";
import { PARRY_DISABLED_ATTRIBUTE, PLAYER_WEAPON_ATTRIBUTE } from "shared/utils/combat/playerAnimations";

export const PlayerCombatSystem = {
	name: "PlayerCombatSystem",
	system: () => {
		const now = os.clock();

		for (const [e, active] of world.query(Components.Attacking).with(Components.Player)) {
			if (now >= active.expiresAt) world.remove(e, Components.Attacking);
		}
		for (const [e, readyAt] of world.query(Components.ParryDisabledUntil)) {
			if (now >= readyAt) world.remove(e, Components.ParryDisabledUntil);
		}

		for (const [e, player] of world.query(Components.Player).with(pair(Components.CurrentlyEquipped, Wildcard))) {
			const character = player.Character;
			if (character === undefined) continue;

			const humanoid = character.FindFirstChildOfClass("Humanoid");
			if (isBlocking(e) && (humanoid === undefined || humanoid.Health <= 0 || world.has(e, Components.Stunned))) {
				forceEndBlock(e);
			}

			const id = getEquippedId(e);
			if (character.GetAttribute(PLAYER_WEAPON_ATTRIBUTE) !== id) {
				forceEndBlock(e); // weapon changed mid-block
				character.SetAttribute(PLAYER_WEAPON_ATTRIBUTE, id);
			}
			const disabled = world.has(e, Components.ParryDisabledUntil);
			if (character.GetAttribute(PARRY_DISABLED_ATTRIBUTE) !== disabled) {
				character.SetAttribute(PARRY_DISABLED_ATTRIBUTE, disabled);
			}
		}
	},
};
