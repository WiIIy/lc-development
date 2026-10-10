type misc = Folder & {
	puddles: Folder & {
		Puddle1: BasePart;
		Puddle2: BasePart;
		Puddle3: BasePart;
	};
	dossierTemplate: Folder & {
		Dossier2: Model & {
			cover: Part & {
				Mesh: BlockMesh;
				FrontWeld: WeldConstraint;
			};
			front: Part & {
				Mesh: BlockMesh;
			};
			Label: UnionOperation & {
				FrontWeld: WeldConstraint;
				NameLabel: Part & {
					FrontWeld: WeldConstraint;
				};
			};
		};
		Dossier3: Model & {
			cover: Part & {
				Mesh: BlockMesh;
				FrontWeld: WeldConstraint;
			};
			front: Part & {
				Mesh: BlockMesh;
			};
			Label: UnionOperation & {
				FrontWeld: WeldConstraint;
				NameLabel: Part & {
					FrontWeld: WeldConstraint;
				};
			};
		};
		DossierUIBackground: Model & {
			CameraPart: Part;
			cover: Part & {
				Mesh: BlockMesh;
				FrontWeld: WeldConstraint;
			};
			front: Part & {
				Mesh: BlockMesh;
			};
			Paper: Part;
			Label: UnionOperation & {
				FrontWeld: WeldConstraint;
				NameLabel: Part & {
					FrontWeld: WeldConstraint;
				};
			};
		};
		Dossier4: Model & {
			cover: Part & {
				Mesh: BlockMesh;
				FrontWeld: WeldConstraint;
			};
			front: Part & {
				Mesh: BlockMesh;
			};
			Label: UnionOperation & {
				FrontWeld: WeldConstraint;
				NameLabel: Part & {
					FrontWeld: WeldConstraint;
				};
			};
		};
		Dossier1: Model & {
			cover: Part & {
				Mesh: BlockMesh;
				FrontWeld: WeldConstraint;
			};
			front: Part & {
				Mesh: BlockMesh;
			};
			Label: UnionOperation & {
				FrontWeld: WeldConstraint;
				NameLabel: Part & {
					FrontWeld: WeldConstraint;
				};
			};
		};
	};
};
