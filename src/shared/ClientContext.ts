import { ReplicatedStorage } from "@rbxts/services";
import CameraShaker, { CameraShakeInstance } from "@rbxts/camera-shaker";

// shared interface for client stuff
export interface IViewmodelController {
	aimDistance: CFrame; //distance between aimpart and camera
	aimOffset: CFrame; //offset to humanoidrootpart to bring AimPart to camera
	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
	rootPart: Part;
	camera: Camera;
	item: Model | undefined;
	applyRecoil(verticalImpulse: number, horizontalMax: number, damping: number): void;
	shakeCamera(shakeType: typeof CameraShaker.Presets.Bump): void;
}

export interface IMirrorController {
	destroyMirror: () => void;
}

export interface IUIController {
	entityDetailsRoot: BillboardGui;
}

// Export a global container
export const ClientContext = {
	ViewmodelController: undefined as IViewmodelController | undefined,
	MirrorController: undefined as IMirrorController | undefined,
	UIController: undefined as IUIController | undefined,
};
