import Make from "@rbxts/make";
import { Entity } from "@rbxts/replecs/out/jecs";
import world from "shared/world";
import Components from "shared/components/components";
import { getWeaponData } from "shared/utils/npc/attack/getWeaponData";

//some moves attach a callback to an animation event
export const MoveCallbacks = {
	light: (weaponString: string, animator: Animator, e: Entity) => {
		print("lightcallback running");
		const weaponData = getWeaponData(e);
		const lightAnim = weaponData?.animations.light;
		print(animator, lightAnim, weaponData);
		const anim = Make("Animation", { AnimationId: lightAnim });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			print("hit");
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance

			connection.Disconnect();
		});
		const trackConnection = track.Ended.Connect(() => {
			if (world.has(e, Components.AttackOngoing)) {
				print("removing attackOngoing");
				world.remove(e, Components.AttackOngoing);
			}
			trackConnection.Disconnect();
		});
		track.Play();
	},
	heavy: (weaponString: string, animator: Animator, e: Entity) => {
		print("heavycallback running");
		const weaponData = getWeaponData(e);
		const heavyAnim = weaponData?.animations.heavy;
		const anim = Make("Animation", { AnimationId: heavyAnim });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			print("hit");
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance
			connection.Disconnect();
		});
		const trackConnection = track.Ended.Connect(() => {
			print("ended")
			if (world.has(e, Components.AttackOngoing)) {
				print("removing attackOngoing");
				world.remove(e, Components.AttackOngoing);
			}
			trackConnection.Disconnect();
		});
		track.Play();
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
