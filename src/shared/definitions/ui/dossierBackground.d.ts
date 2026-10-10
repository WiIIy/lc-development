type DossierModel = Model & {
	Label: UnionOperation & {
		NameLabel: Part;
	};
};

type DossierCabinetModel = Model & {
	DossierDrawer: Model;
};

// UI Template Type in StarterGui
type DossierGuiTemplate = SurfaceGui & {
	Frame: Frame & {
		TextButton: TextButton;
	};
};
