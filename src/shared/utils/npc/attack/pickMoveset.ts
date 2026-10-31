export function pickMoveset(movesets: MovesetData[]): string[] | undefined {
	let total = 0;
	for (const m of movesets) total += m.weight;
	if (total <= 0 || movesets.size() === 0) return undefined;

	let roll = math.random() * total;
	for (const m of movesets) {
		roll -= m.weight;
		if (roll <= 0) return m.combo;
	}
	return movesets[movesets.size() - 1].combo;
}
