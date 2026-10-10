type viewmodels = Folder & {
	BaseViewmodel: Model & {
		Humanoid: Humanoid;
		AnimationController: AnimationController & {
			Animator: Animator;
		};
		RightArm: MeshPart & {
			Texture: Texture;
			RightArmLower: Motor6D; //right arm 0, right arm lower 1
		};
		AnimSaves: ObjectValue;
		HumanoidRootPart: Part & {
			CameraPart: Motor6D; //root 0, campart 1
			RightArm: Motor6D; //root 0, right arm 1
			LeftArm: Motor6D; //root 0, left arm 1
			RootAttachment: Attachment;
		};
		LeftArmLower: MeshPart & {
			Texture: Texture;
		};
		Shirt: Shirt;
		LeftArm: MeshPart & {
			Texture: Texture;
			LeftArmLower: Motor6D; //left arm 0, left arm lower 1
		};
		RightArmLower: MeshPart & {
			Texture: Texture;
		};
		CameraPart: Part;
	};
};
