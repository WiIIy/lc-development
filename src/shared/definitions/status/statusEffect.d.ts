type BodyPart = "Head" | "Torso" | "Left Arm" | "Right Arm" | "Left Leg" | "Right Leg";

type StatusEffect = {
	id: string; // "Bleeding", "Fracture", "Blindness"
	bodyPart?: BodyPart | "Left Eye" | "Right Eye"; // Optional location
	startTime?: number; // For timers
	durationLeft?: number; //seconds
	type: "debuff" | "buff"; //controls whether theyre displayed on the first row of status displays or the 2nd
	//if durationleft variable exists it will display with a ui corner radius (circular status icons indicate that it's timed)
}