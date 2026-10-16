import { Controller, OnRender, OnStart } from "@flamework/core";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import { Players, UserInputService, Workspace } from "@rbxts/services";
import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";

export let localPlayerEntity: Entity | undefined;
const INVISIBLE_PARTS = new Set(["Head", "Left Arm", "Right Arm", "Torso"]);

@Controller({})
export class ViewmodelController implements OnStart, OnRender {
	private cam: Camera;
	private head: Part;
    private torso: BasePart;
	private character: Model;
    private yaw = 0;
    private pitch = 0;
    private fov = 90;

	constructor() {
		this.cam = Workspace.CurrentCamera!;
        this.character = Players.LocalPlayer.Character || (Players.LocalPlayer.CharacterAdded.Wait()[0] as Model);
		this.head = this.character.FindFirstChild("Head") as Part;
        this.torso =  this.character.FindFirstChild("Torso") as BasePart;
        this.cam.FieldOfView = this.fov
	}

	onStart(): void {
		// this.cam.CameraType = Enum.CameraType.Custom;
       
        this.character.ChildAdded.Connect((child) => {
        this.checkChild(child);
        });

        this.applyArmOffset(this.torso);

		UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
        
        const a = this.character.GetChildren()
        print(a)
        // a.forEach((child)=>{
        //     if(child.IsA("Accessory")){
        //         const handle = child.FindFirstChild("Handle")!;
        //         if (handle?.FindFirstChild("HatAttachment") || handle.FindFirstChild("FaceFrontAttachment"))
        //         {
        //             print("lol")

        //         }
        //     } 
        //     if (child.Name === "Head" &&  child.IsA("BasePart")){
        //         child.LocalTransparencyModifier = 1
        //     }
        // })
	}

	onRender(dt: number): void {
        this.head.LocalTransparencyModifier = 1
        this.torso.LocalTransparencyModifier = 1
		const mouseDelta = UserInputService.GetMouseDelta();
        this.yaw -= mouseDelta.X * 0.003; // Adjust sensitivity here
        this.pitch = math.clamp(this.pitch - mouseDelta.Y * 0.003, math.rad(-85), math.rad(85));

        const cameraRotation = CFrame.Angles(0, this.yaw, 0).mul(CFrame.Angles(this.pitch, 0, 0));
        this.cam.CFrame = new CFrame(this.head.Position).mul(cameraRotation).mul(new CFrame(0,0.1,0));
	}
    
    checkChild(child: Instance) {
    if (child.IsA("Accessory")) {
        const handle = child.FindFirstChild("Handle") as BasePart;
        if (handle && (handle.FindFirstChild("HatAttachment") || handle.FindFirstChild("FaceFrontAttachment") || handle.FindFirstChild("HairAttachment"))) {
            print("Found accessory:", child.Name);
            child.Destroy()
            handle.LocalTransparencyModifier = 1;
            setDescendantLocalTransparency(handle, 1);
            }
        }
    }

    applyArmOffset(torso: BasePart) {
        // R6 joint names vs R15 joint names
        const shoulderNames = ["Right Shoulder", "Left Shoulder", "RightShoulder", "LeftShoulder"];

        shoulderNames.forEach((name) => {
            const joint = torso.FindFirstChild(name) as Motor6D;
            if (joint) {
                // Shift the C0 coordinate space downward by 0.5 studs locally
                const currentC0 = joint.C0;
                joint.C0 = new CFrame(currentC0.X, currentC0.Y - 0.5, currentC0.Z).mul(currentC0.Rotation);
            }
        });
    }
}
