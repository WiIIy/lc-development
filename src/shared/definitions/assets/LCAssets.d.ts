type LCAssets = {
	characters: Folder & {
		base: Model;
	};
	sounds: Folder & {
		ItemSounds: Folder & {
			Melee: Folder & {
				Fists: MeleeItemSounds;
			};
		};
		ActionSounds: Folder & {
			Dash: {
				dash1: Sound;
				dash2: Sound;
				dash3: Sound;
			};
		};
	};
};
