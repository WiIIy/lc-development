import Make from "@rbxts/make";
import { Entity } from "@rbxts/replecs/out/jecs";
import world from "shared/world";
import Components from "shared/components/components";

//some moves attach a callback to an animation event
export const MoveCallbacks = {
	light: (weaponString: string, animator: Animator, e: Entity) => {
		const anim = Make("Animation", { AnimationId: "placeholder" });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance

			const trackConnection = track.Ended.Connect(() => {
				if (world.get(e, Components.AttackOngoing)) {
					world.remove(e, Components.AttackOngoing);
				}
				trackConnection.Disconnect();
			});
			connection.Disconnect();
		});
	},
	heavy: (weaponString: string, animator: Animator, e: Entity) => {
		const anim = Make("Animation", { AnimationId: "placeholder" });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("hit").Connect(() => {
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance

			const trackConnection = track.Ended.Connect(() => {
				if (world.get(e, Components.AttackOngoing)) {
					world.remove(e, Components.AttackOngoing);
				}
				trackConnection.Disconnect();
			});
			connection.Disconnect();
		});
	},
	knifethrow: (weaponString: string, animator: Animator, e: Entity) => {
		const anim = Make("Animation", { AnimationId: "placeholder" });
		const track = animator.LoadAnimation(anim);
		const connection = track.GetMarkerReachedSignal("throw").Connect(() => {
			//hit registration and logging

			//print if hit print if miss. the hits are using raycast
			//if hit, roll for bleed/fracture chance

			const trackConnection = track.Ended.Connect(() => {
				if (world.get(e, Components.AttackOngoing)) {
					world.remove(e, Components.AttackOngoing);
					world.remove(e, Components.AttackOngoing);
				}
				trackConnection.Disconnect();
			});
			connection.Disconnect();
		});
	},
};
