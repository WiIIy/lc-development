type ItemSounds = Folder & {
	equip: Sound;
	parrying: Sound;
	dropping: Sound;
};

type MeleeItemSounds = ItemSounds & {
	light: Sound;
	heavy: Sound;
	special?: Sound;
};
