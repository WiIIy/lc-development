import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";

const Debris = game.GetService("Debris");

/** the Health component is the source of truth, the Humanoid mirrors it. Returns undefined if nothing was damaged */
export function damageNpc(e: Entity, model: Model, amount: number): number | undefined {
	const health = world.get(e, Components.Health);
	const humanoid = model.FindFirstChildOfClass("Humanoid");
	if (health === undefined || humanoid === undefined) {
		warn(`[damageNpc] ${model.Name} needs both a Health component and a Humanoid`);
		return undefined;
	}
	const current = math.max(0, health.current - amount);
	world.set(e, Components.Health, { current, max: health.max });
	humanoid.MaxHealth = health.max;
	humanoid.Health = current;
	if (current <= 0) world.add(e, Components.Dead);
	return current;
}

export function rollStatusEffects(target: Entity, data: { bleedChance: number; fractureChance: number }, limb: string) {
	const effect = { startTime: os.clock(), severity: 1, limb };
	if (!world.has(target, Components.Bleeding) && math.random() < data.bleedChance) {
		world.set(target, Components.Bleeding, effect);
		print(`[status] ${target} is bleeding (${limb})`);
	}
	if (!world.has(target, Components.Fracture) && math.random() < data.fractureChance) {
		world.set(target, Components.Fracture, { startTime: effect.startTime, severity: 1, limb });
		print(`[status] ${target} has a fracture (${limb})`);
	}
}

/** created on the server, so everyone sees it without a new remote */
export function showDamageNumber(model: Model, text: string) {
	const head = model.FindFirstChild("Head") ?? model.FindFirstChild("HumanoidRootPart");
	if (head === undefined || !head.IsA("BasePart")) {
		warn(`[showDamageNumber] ${model.Name} has no Head or HumanoidRootPart`);
		return;
	}
	const gui = new Instance("BillboardGui");
	gui.Size = UDim2.fromOffset(160, 36);
	gui.StudsOffset = new Vector3(math.random(-10, 10) / 10, 2, 0);
	gui.AlwaysOnTop = true;

	const label = new Instance("TextLabel");
	label.Size = UDim2.fromScale(1, 1);
	label.BackgroundTransparency = 1;
	label.TextColor3 = Color3.fromRGB(255, 90, 90);
	label.TextStrokeTransparency = 0;
	label.TextScaled = true;
	label.Text = text;
	label.Parent = gui;

	gui.Parent = head;
	Debris.AddItem(gui, 0.9);
}
