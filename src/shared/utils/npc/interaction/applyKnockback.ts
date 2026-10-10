import { setDescendantsNetworkOwner } from "shared/utils/world/setDescendant";

//a server function probably
export function applyKnockback(hitPart: BasePart, origin: Vector3, targetPosition: Vector3, velocity?: Vector3) {
	const character = hitPart.FindFirstAncestorOfClass("Model") as Model;
	const humanoid = character?.FindFirstChildOfClass("Humanoid"); //check if its an r6 character, dont want random models flinging from gunshots
	if (!character || !humanoid) return;

	setDescendantsNetworkOwner(character, undefined); //this works on a lot of things. i mean anything in the workspace

	const baseDirection = velocity ? velocity.Unit : targetPosition.sub(origin).Unit;

	const upward = new Vector3(0, 0.25, 0);
	const finalDirection = baseDirection.add(upward).Unit;

	const force = 80;

	hitPart.ApplyImpulse(finalDirection.mul(force * hitPart.AssemblyMass));
	print("knockback moment");
}
