import Make from "@rbxts/make";
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";
import { getWeaponData } from "shared/utils/npc/attack/getWeaponData";
import { NpcMeleeWeaponsData } from "shared/data/npcs/weaponsData";

const Workspace = game.GetService("Workspace");
const Players = game.GetService("Players");

//flip to true to see the cast volume in-game while tuning size/distance
const DEBUG_HITBOX = true;

/**
 * Hit registration, meant to be called from the animation "hit" marker.
 * Casts a block from the npc along its aim direction, finds the first player character in the way,
 * then applies damage and rolls bleed/fracture. Returns true if something was hit.
 */
export function registerMeleeHit(e: Entity, moveName: string, animator: Animator, weaponData: NpcMeleeWeapon): boolean {
	if (!world.contains(e)) return false;

	const moves = weaponData.moves;
	const moveData = moves?.[moveName];
	if (moveData === undefined) return false;

	const { size, distance } = moveData.blockcast;

	const npcModel = animator.FindFirstAncestorOfClass("Model");
	const targetEntity = world.target(e, Components.Target);

	//aim: where the npc is facing by default, or straight at the target when aimAtTarget is set
	const transform = world.get(e, Components.Transform) as CFrame;
	const origin = transform.Position;

	const look = transform.LookVector;
	const flat = new Vector3(look.X, 0, look.Z);
	const forward = flat.Magnitude > 0.001 ? flat.Unit : look; //block cast is aimed wherever the npc is facing 

	//block cast is aimed at target player
	// if (targetEntity !== undefined) {
	// 	const targetTransform = world.get(e, Components.TargetTransform);
	// 	if (targetTransform !== undefined) {
	// 		const flat = new Vector3(targetTransform.Position.X - origin.X, 0, targetTransform.Position.Z - origin.Z);
	// 		if (flat.Magnitude > 0) forward = flat.Unit;
	// 	}
	// }

	const backOffset = size.Z / 2 + 2; // clear the NPC's own body + a margin
	const castOrigin = origin.sub(forward.mul(backOffset));
	const castCFrame = CFrame.lookAt(castOrigin, castOrigin.add(forward));
	const params = new RaycastParams();
	params.FilterType = Enum.RaycastFilterType.Exclude;
	params.FilterDescendantsInstances = [npcModel!]; //never hit ourselves

	const result = Workspace.Blockcast(castCFrame, size, forward.mul(distance + backOffset), params);

	if (DEBUG_HITBOX) {
		//box swept over the whole cast, centered halfway along it
		const debugPart = Make("Part", {
			Anchored: true,
			CanCollide: false,
			CanQuery: false,
			CanTouch: false,
			Size: new Vector3(size.X, size.Y, size.Z + distance + backOffset),
			CFrame: castCFrame.mul(new CFrame(0, 0, -(distance+backOffset) / 2)),
			Color: result ? Color3.fromRGB(255, 60, 60) : Color3.fromRGB(60, 255, 60),
			Transparency: 0.7,
			Parent: Workspace,
		});
		task.delay(0.25, () => debugPart.Destroy());
	}

	//only player characters are valid victims
	const victimModel = result?.Instance.FindFirstAncestorOfClass("Model");
	const victimPlayer = victimModel ? Players.GetPlayerFromCharacter(victimModel) : undefined;
	const humanoid = victimModel?.FindFirstChildOfClass("Humanoid");
	if (victimModel === undefined || victimPlayer === undefined || humanoid === undefined) {
		print(`[${moveName}] miss`);
		return false;
	}

	//TODO(parry): check if the victim is parrying before damaging, stun the npc instead (see old processHit)
	print(targetEntity);
	const parrying = world.has(targetEntity!, Components.Parrying);
	print("parrying:", parrying);

	if (parrying) {
		print("hit parried");
		return false;
	}

	const currHealth = world.get(targetEntity!, Components.Health);
	world.set(targetEntity!, Components.Health, {
		current: currHealth!.current - moveData.damage,
		max: currHealth!.max,
	});
	humanoid.TakeDamage(moveData.damage);
	print(`[${moveName}] hit ${victimModel.Name} for ${moveData.damage}`);
	//TODO(log): record attacker, victim, move and damage in the kill/damage log

	if (math.random() < moveData.bleedChance) {
		//TODO(components): apply Bleeding to the victim once the component exists
		print(`[${moveName}] bleed rolled on ${victimModel.Name}`);
	}
	if (math.random() < moveData.fractureChance) {
		//TODO(components): apply Fracture to the victim once the component exists
		print(`[${moveName}] fracture rolled on ${victimModel.Name}`);
	}
	return true;
}
