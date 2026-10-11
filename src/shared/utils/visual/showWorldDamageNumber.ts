import { TweenService, Workspace, Debris } from "@rbxts/services";

function getDamageColor(damage: number): Color3 {
	if (damage > 45) return new Color3(1, 0, 0);
	if (damage < 25) return new Color3(1, 1, 1);

	const percentage = (damage - 25) / 20;
	const greenBlue = 1 - percentage;
	return new Color3(1, greenBlue, greenBlue);
}

function computeDistanceScale(position: Vector3): number {
	const camera = Workspace.CurrentCamera;
	if (!camera) return 1;

	const distance = camera.CFrame.Position.sub(position).Magnitude;

	const minDistance = 10;
	const maxDistance = 120;

	const clamped = math.clamp(distance, minDistance, maxDistance);
	const alpha = (clamped - minDistance) / (maxDistance - minDistance);

	return 1 - alpha * 0.65;
}

export function showWorldDamageNumber(damageAmount: number, position: Vector3) {
	const attachment = new Instance("Attachment");
	attachment.WorldPosition = position;
	attachment.Parent = Workspace.Terrain;

	const scale = computeDistanceScale(position);

	const billboard = new Instance("BillboardGui");
	billboard.Size = UDim2.fromOffset(100 * scale, 40 * scale);
	billboard.AlwaysOnTop = true;

	// spawn exactly at the origin
	billboard.StudsOffset = new Vector3(0, 0, 0);

	billboard.Adornee = attachment;
	billboard.Parent = attachment;

	const textLabel = new Instance("TextLabel");
	textLabel.Text = tostring(math.round(damageAmount));
	textLabel.Size = UDim2.fromScale(1, 1);
	textLabel.BackgroundTransparency = 1;
	textLabel.Font = Enum.Font.Arimo;
	textLabel.TextColor3 = getDamageColor(damageAmount);
	textLabel.TextSize = 18 * scale;

	// start invisible for fade-in
	textLabel.TextTransparency = 1;
	textLabel.TextStrokeTransparency = 1;

	textLabel.Parent = billboard;

	/* ---------- MOVEMENT TWEEN ---------- */

	const horizontalDirection = math.random() < 0.5 ? -1 : 1;
	const horizontalOffset = horizontalDirection * math.random(0.4, 1);

	const moveTween = TweenService.Create(
		billboard,
		new TweenInfo(1.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{
			StudsOffset: new Vector3(horizontalOffset, 2.2, 0),
		},
	);

	moveTween.Play();

	/* ---------- FADE IN ---------- */

	const fadeInTween = TweenService.Create(
		textLabel,
		new TweenInfo(0.05, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{
			TextTransparency: 0,
			TextStrokeTransparency: 0,
		},
	);

	fadeInTween.Play();

	/* ---------- HOLD THEN FADE OUT ---------- */

	task.delay(0.4, () => {
		const fadeOutTween = TweenService.Create(
			textLabel,
			new TweenInfo(0.7, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
			{
				TextTransparency: 1,
				TextStrokeTransparency: 1,
			},
		);

		fadeOutTween.Play();
	});

	Debris.AddItem(attachment, 2);
}