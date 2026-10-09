import { StatusEffect, StatusEffectDecorator } from "@rbxts/wcs";

@StatusEffectDecorator
export class Stun extends StatusEffect {
	public OnStartServer() {
		print("Stun just started!");
	}
}
