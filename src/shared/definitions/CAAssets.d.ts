type CAAssets = Folder & {
	accessories: accessories;
	tracers: tracers;
	casings: casings;
	weapons: Folder & {};
	audio: audio;
	dialogueTrees: dialogueTrees;
	items: Folder & {
		//right handed (main)
		Baseballbat: BaseItemModel;
		Fireaxe: BaseItemModel;
		Rat: BaseItemModel;
		Knife: BaseItemModel;
		Claw: BaseItemModel;
		Kabar: BaseItemModel;
		Lobotomizer: BaseItemModel;
		Sledgehammer: BaseItemModel;
		Jesus: BaseItemModel;
		Teeth: BaseItemModel;
		Molotov: BaseItemModel;
		Jerrycan: BaseItemModel;
		Flashlight: BaseItemModel;
		Lighter: BaseItemModel;
		Walkman: BaseItemModel;
		Droneremote: BaseItemModel;
		Antler: BaseItemModel;

		//guns
		Pistol: BaseItemModel; //get rid of this one day
		Vag73: BaseItemModel;
		M10: BaseItemModel;
		Serpent: BaseItemModel;
		R50: BaseItemModel;
		Taurus: BaseItemModel;

		//left handed (reserved for skills etc)
		LighterL: BaseItemModel;
		Drone: BaseItemModel;
	};
	props: Folder & {
		Cup: BaseItemModel;
		Bottle1: BaseItemModel;
		Waterbottle: BaseItemModel;
		Propane: BaseItemModel;
		// Car: BaseItemModel;
		Extingusher: BaseItemModel;
		// Chair1: BaseItemModel;
		// Chair2: BaseItemModel;
		// Chair3: BaseItemModel;
	};
	effects: {
		Dash: ParticleEmitter;
		DashTrail: Trail;
		Flame: Part;
	};
	viewmodels: viewmodels;
	misc: misc;
	enemy: Folder & {
		BaseEnemy: Model;
	};
	outfits: outfits;
};
