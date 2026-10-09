type accessories = Folder & {
	character: Folder & {
		items: Folder & {
			Vag73: Accessory;
			R50: Accessory;
			Serpent: Accessory;
			M10: Accessory;
			Taurus: Accessory;
		};
		LariR: Accessory;
		LariL: Accessory;
		GrapplingHookArmL: Accessory;
		GrapplingHookBelt: Accessory;
		GrapplingHookLegL: Accessory;
		GrapplingHookLegR: Accessory;
		JesusJudas: Accessory; //a katana and its sheath
	};
	viewmodel: Folder & {
		GrapplingHookArmL_vm: vmAccessory; //not really an accessory
	};
};

type vmAccessory = Model & {
	Handle: BasePart & {
		weld: Weld;
	};
};
