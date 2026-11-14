import Make from "@rbxts/make";
import { Entity } from "@rbxts/replecs/out/jecs";
import world from "shared/world";
import Components from "shared/components/components";
import { getWeaponData } from "shared/utils/npc/attack/getWeaponData";
import { registerMeleeHit } from "shared/utils/npc/attack/registerMeleeHit";
import { announceSwing } from "shared/utils/npc/attack/predictiveParry";

//some moves attach a callback to an animation event
export const MoveCallbacks = {
	light: (weaponString: string, animator: Animator, e: Entity) => {
		// print("lightcallback running");
		const weaponData = getWeaponData(e);
		const lightAnim = weaponData?.animations.light;
		// print(animator, lightAnim, weaponData);
		const anim = Make("Animation", { AnimationId: lightAnim });
		const track = animator.LoadAnimation(anim);
		world.set(e, Components.AttackTrack, track); // NEW: lets cancelAttack() stop the swing
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			connection.Disconnect(); // moved to the top
			if (!world.has(e, Components.AttackOngoing)) return;
			const result = registerMeleeHit(e, "light", animator, weaponData!);
			print("result", result);

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance
			// const targetEntity = world.target(e, Components.Target); removed cause parry check is in registermeleehit
		});
		const trackConnection = track.Ended.Connect(() => {
			if (world.has(e, Components.AttackOngoing)) {
				// print("removing attackOngoing");
				world.remove(e, Components.AttackOngoing);
			}
			trackConnection.Disconnect();
		});
		track.Play();
		if (weaponData !== undefined) announceSwing(e, "light", weaponData); // "heavy" in the heavy callback
	},
	heavy: (weaponString: string, animator: Animator, e: Entity) => {
		print("heavycallback running");
		const weaponData = getWeaponData(e);
		const heavyAnim = weaponData?.animations.heavy;
		const anim = Make("Animation", { AnimationId: heavyAnim });
		const track = animator.LoadAnimation(anim);
		world.set(e, Components.AttackTrack, track); // NEW: lets cancelAttack() stop the swing
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			connection.Disconnect(); // moved to the top
			if (!world.has(e, Components.AttackOngoing)) return;

			const result = registerMeleeHit(e, "heavy", animator, weaponData!);
			print("result", result);
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance
		});
		const trackConnection = track.Ended.Connect(() => {
			if (world.has(e, Components.AttackOngoing)) {
				// print("removing attackOngoing");
				world.remove(e, Components.AttackOngoing);
			}
			trackConnection.Disconnect();
		});
		track.Play();
		if (weaponData !== undefined) announceSwing(e, "light", weaponData); // "heavy" in the heavy callback
	},
	knifethrow: (weaponString: string, animator: Animator, e: Entity) => {
		const anim = Make("Animation", { AnimationId: "placeholder" });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("throw").Connect(() => {
			//hit registration and logging
			print("hit");
			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance

			connection.Disconnect();
		});

		const trackConnection = track.Ended.Connect(() => {
			if (world.get(e, Components.AttackOngoing)) {
				world.remove(e, Components.AttackOngoing);
				world.remove(e, Components.AttackOngoing);
			}
			trackConnection.Disconnect();
		});
	},
};
