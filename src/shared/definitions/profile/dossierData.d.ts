type AvatarData = {
	shirt: string;
	pants: string;
	accessories: number[];
	nickname: string;
	highlight: { r: number; g: number; b: number };
	gender: "male" | "female" | "none";
	skin: { r: number; g: number; b: number };
};

type DossierPageData = {
	label: string;
	images: DossierImage[];
};

type DossierImage = {
	id: string;
	assetId: string;
	position: { x: number; y: number }; // Scale values
	size: { x: number; y: number };
	zIndex: number;
	aspectratio?: number;
	bgColor?: Color3;
};

type DossierData = {
	creatorUserId: number;
	currentPage: "1" | "2";
	pages: Record<"1" | "2", DossierPageData>;
	avatar: AvatarData;
	build: {
		id: string;
		buildName: string;
		loadout: string[];
		skills: string[];
	};
};
