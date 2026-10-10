import { monologue } from "shared/sharedAtoms";

let activeTask: thread | undefined;

export function sayMonologue(text: string) {
	if (activeTask !== undefined) {
		task.cancel(activeTask);
		activeTask = undefined;
	}

	monologue(text);

	if (text === "") return;

	const charCount = text.size();

	const duration = math.max(1.5, charCount / 15 + 0.5); //longer text get more appearance duration

	activeTask = task.delay(duration, () => {
		monologue("");
		activeTask = undefined;
	});
};