import { RemoteEvents } from "server/network";
import { Service, OnStart } from "@flamework/core";

@Service({})
export class HeadMovementService implements OnStart {
	onStart(): void {
		RemoteEvents.neckMovement.connect((player, neckC0, rightShC0, leftShC0) => {
			const char = player.Character;
			if (!char) return;
			const torso = char.FindFirstChild("Torso") as BasePart;
			if (torso) {
				(torso.FindFirstChild("Neck") as Motor6D).C0 = neckC0;

				if (rightShC0) {
					(torso.FindFirstChild("Right Shoulder") as Motor6D).C0 = rightShC0;
				}
				if (leftShC0) {
					(torso.FindFirstChild("Left Shoulder") as Motor6D).C0 = leftShC0;
				}
			}
		});
	}
}
