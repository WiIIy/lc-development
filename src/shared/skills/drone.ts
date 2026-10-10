// ///FIX THIS BRO


// import { ContextActionService, Players, ReplicatedStorage, RunService, StarterGui, Workspace } from "@rbxts/services";
// import { Message, Skill, SkillDecorator } from "@rbxts/wcs";

// import Components from "shared/components/components";

// const DRONE_SPEED = 10;
// const DRONE_TURN_SPEED = 3;

// @SkillDecorator
// export class Drone extends Skill {
// 	droneModelTemplate: Model = ItemContainer.Drone as BaseItemModel;
// 	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel | undefined;

// 	characterDrone: Model | undefined;
// 	viewmodelDrone: Model | undefined;

// 	isDeployed: boolean = false; //state deprecated. the deployed status is stored in jecs world
// 	isViewingFeed: boolean = false;

// 	feedCamera: Camera | undefined;
// 	renderConnection: RBXScriptConnection | undefined;

// 	hoverTime: number = 0;
// 	rollStabilizeStrength = 0.08;
// 	liveFeedManager: LiveCameraFeed | undefined;
// 	pitchSpeed = 2;
// 	feedFOV = 80;

// 	serverHoverConnection: RBXScriptConnection | undefined;
// 	serverHoverTime = 0;
// 	bladeSpinConnection: RBXScriptConnection | undefined;

// 	// Input states for drone movement
// 	movementInputs = {
// 		forward: 0, //w
// 		backward: 0, //s
// 		left: 0, //a
// 		right: 0, //d
// 		up: 0, //space
// 		down: 0, //shift
// 		pitchUp: 0, // E
// 		pitchDown: 0, // Q
// 	};

// 	focusTrack: AnimationTrack | undefined;

// 	protected OnStartClient(): void {
// 		if (!this.viewmodel) {
// 			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
// 				"BaseViewmodel",
// 			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
// 		}

// 		const remote = this.viewmodel?.FindFirstChild("Droneremote") as Model | undefined;
// 		const displayPart = remote?.FindFirstChild("display") as BasePart;
// 		const player = Players.LocalPlayer;
// 		const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
// 		const surfaceGui = playerGui?.FindFirstChild("DroneGui") as SurfaceGui;
// 		surfaceGui.Adornee = displayPart;

// 		// AnimationUtils.preloadAnimations(this.viewmodel, [ANIMATION_IDS.viewmodel.Drone.closeUp]);

// 		//only weld drone to vm if deployed is false
// 		//item entity doesnt exist on client so state has to be passed from server first
// 	}

// 	protected OnStartServer(): void {
// 		const itemEntity = this.getDroneEntity();
// 		// print("droneEntity", itemEntity);
// 		if (itemEntity !== undefined) {
// 			const droneData = world.get(itemEntity, Components.Drone);
// 			// print(droneData, droneData?.deployed);
// 			if (droneData && droneData.deployed && droneData.instance) {
// 				// Drone is already out in world!
// 				print(this.characterDrone, "drone instance");
// 				this.characterDrone = droneData.instance;
// 				this.setCharacterDroneOnClient(this.characterDrone);

// 				// Give network ownership back to the player who just equipped the remote
// 				this.characterDrone.GetDescendants().forEach((desc) => {
// 					if (desc.IsA("BasePart")) desc.SetNetworkOwner(this.Player);
// 				});
// 				return; // Skip welding to character
// 			}
// 		}
// 		this.weldDroneToCharacter();
// 		this.weldDroneToViewmodel(); //item entity doesnt exist on client so state has to be passed from server first
// 	}

// 	// ==========================================
// 	// Welding & Setup
// 	// ==========================================

// 	weldDroneToCharacter() {
// 		const charDrone = this.droneModelTemplate.Clone() as BaseItemModel;
// 		this.characterDrone = charDrone;

// 		const lArm = this.Player!.Character!.WaitForChild("Left Arm") as BasePart;

// 		charDrone.Parent = this.Player!.Character!;
// 		if (charDrone.characterweld) {
// 			charDrone.characterweld.Part0 = lArm;
// 			charDrone.characterweld.Part1 = charDrone.handle;
// 		}
// 	}

// 	@Message({ Type: "Event", Destination: "Client" })
// 	weldDroneToViewmodel() {
// 		if (!this.viewmodel) return;
// 		const vmDrone = this.droneModelTemplate.Clone() as BaseItemModel;
// 		this.viewmodelDrone = vmDrone;
// 		vmDrone.Parent = this.viewmodel;

// 		if (vmDrone.viewmodelweld) {
// 			vmDrone.viewmodelweld.Part0 = this.viewmodel.LeftArmLower;
// 			vmDrone.viewmodelweld.Part1 = vmDrone.handle;
// 		}
// 	}

// 	// ==========================================
// 	// Deployment (F Key)
// 	// ==========================================

// 	deployOrPickup() {
// 		const playerEntity = ref.find(this.Player!);
// 		if (playerEntity === undefined) return;

// 		const item = getPlayersCururentlyHeldItem(this.Player!) as string;
// 		const itemEntity = world.target(playerEntity!, Components.CurrentlyEquipped);
// 		const droneData = world.get(itemEntity!, Components.Drone);
// 		const isDeployed = droneData ? droneData.deployed : false;

// 		if (!this.isDeployed) {
// 			print("deploy");
// 			// DEPLOY
// 			this.isDeployed = true;
// 			droneDeployed(true);
// 			const char = this.Player!.Character;
// 			const spawnCFrame = char?.PrimaryPart?.CFrame.mul(new CFrame(0, 0, -4)) || new CFrame();

// 			if (this.viewmodelDrone) {
// 				this.viewmodelDrone.Destroy();
// 				this.viewmodelDrone = undefined;
// 			}

// 			this.serverDeployDrone(spawnCFrame);
// 		} else {
// 			print("pickup");
// 			// PICKUP (Check distance)
// 			if (!this.characterDrone || !this.characterDrone.PrimaryPart) return;
// 			const root = this.Player!.Character?.FindFirstChild("HumanoidRootPart") as BasePart;
// 			if (!root) return;

// 			const dist = root.Position.sub(this.characterDrone.PrimaryPart.Position).Magnitude;
// 			if (dist <= 8) {
// 				this.isDeployed = false;
// 				droneDeployed(false);
// 				if (this.isViewingFeed) this.unfocusCameraFeed();
// 				this.weldDroneToViewmodel();
// 				this.serverPickupDrone();

// 				if (this.serverHoverConnection) {
// 					this.serverHoverConnection.Disconnect();
// 					this.serverHoverConnection = undefined;
// 				}
// 				if (this.bladeSpinConnection) {
// 					this.bladeSpinConnection.Disconnect();
// 					this.bladeSpinConnection = undefined;
// 				}
// 			} else {
// 				print("Drone is too far to pick up!");
// 			}
// 		}
// 	}

// 	@Message({ Type: "Event", Destination: "Server" })
// 	serverDeployDrone(spawnCFrame: CFrame) {
// 		if (!this.characterDrone) return;

// 		const itemEntity = this.getDroneEntity();
// 		if (!itemEntity) return;

// 		// Unweld and place in world
// 		setDescendantCollisionGroup(this.characterDrone, "Default");
// 		this.characterDrone.FindFirstChild("characterweld")?.Destroy();

// 		this.characterDrone.Parent = Workspace;
// 		this.characterDrone.PivotTo(spawnCFrame);

// 		this.characterDrone.GetDescendants().forEach((desc) => {
// 			if (desc.IsA("BasePart")) {
// 				desc.Anchored = false;
// 				desc.SetNetworkOwner(this.Player);
// 			}
// 		});

// 		// Update ECS Component
// 		const droneData = world.get(itemEntity, Components.Drone)!;
// 		world.set(itemEntity, Components.Drone, {
// 			...droneData,
// 			deployed: true,
// 			instance: this.characterDrone,
// 			cframe: spawnCFrame,
// 		});

// 		this.setCharacterDroneOnClient(this.characterDrone);
// 	}

// 	@Message({ Type: "Event", Destination: "Server" })
// 	applyBodyForceToCharacterDrone() {
// 		if (!this.characterDrone || !this.characterDrone.PrimaryPart) return;
// 		print("Applying body force to drone for hovering");

// 		this.focusTrack = AnimationUtils.loadAnim(
// 			this.Player!.Character!,
// 			"focus",
// 			ANIMATION_IDS.item.Droneremote.focus,
// 			0,
// 			false,
// 		);

// 		const existingForce = this.characterDrone.PrimaryPart.FindFirstChild("AntiGravityForce"); // Destroy existing force to prevent multiple antigravityforces stacking up and sending the drone flying
// 		if (existingForce) {
// 			existingForce.Destroy();
// 		}

// 		let modelMass = 0;
// 		this.characterDrone.GetDescendants().forEach((desc) => {
// 			if (desc.IsA("BasePart")) {
// 				modelMass += desc.Mass;
// 			}
// 		});

// 		const bodyforce = Make("BodyForce", { Force: new Vector3(0, modelMass * Workspace.Gravity, 0) });
// 		bodyforce.Name = "AntiGravityForce";
// 		bodyforce.Parent = this.characterDrone.PrimaryPart;
// 	}
// 	@Message({ Type: "Event", Destination: "Client" })
// 	setCharacterDroneOnClient(drone: Model) {
// 		this.characterDrone = drone;
// 	}

// 	@Message({ Type: "Event", Destination: "Server" })
// 	serverPickupDrone() {
// 		if (this.characterDrone) {
// 			this.characterDrone.Destroy();
// 		}

// 		// Clean up the proxy part
// 		this.Player?.Character?.FindFirstChild("DroneChatProxy")?.Destroy();

// 		this.weldDroneToCharacter();
// 	}

// 	// ==========================================
// 	// Live Feed & Controls (LMB / X)
// 	// ==========================================

// 	turnOnCameraFeed() {
// 		print(this.isViewingFeed, this.isDeployed);
// 		if (this.isViewingFeed) return;
// 		this.isViewingFeed = true;
// 		this.setServerViewingState(true);
// 		isDroneFocusing(true);

// 		// 1. Play Viewmodel Animation (Bring remote to face)
// 		this.focusTrack = AnimationUtils.loadAnim(
// 			this.viewmodel!,
// 			"focus",
// 			ANIMATION_IDS.viewmodel.Droneremote.focus,
// 			0.2,
// 			false,
// 		);

// 		this.applyBodyForceToCharacterDrone();

// 		this.setupViewportCamera(); //Setup ViewportFrame Camera

// 		// 3. Bind Movement Overrides
// 		this.bindDroneControls();

// 		// 4. Start RenderStepped Loop for Camera & Movement
// 		this.renderConnection = RunService.RenderStepped.Connect((dt) => this.droneUpdateLoop(dt));
// 	}

// 	@Message({ Type: "Event", Destination: "Server" })
// 	setServerViewingState(state: boolean) {
// 		this.isViewingFeed = state;
// 		const char = this.Player?.Character;
// 		if (!char) return;

// 		if (state) {
// 			// Create a proxy part inside the Character that BubbleChat will lock onto
// 			if (!char.FindFirstChild("DroneChatProxy") && this.characterDrone) {
// 				const handle = this.characterDrone.FindFirstChild("handle") as BasePart | undefined;
// 				if (handle) {
// 					const proxy = new Instance("Part");
// 					proxy.Name = "DroneChatProxy";
// 					proxy.Transparency = 1;
// 					proxy.CanCollide = false;
// 					proxy.CanQuery = false;
// 					proxy.Massless = true;
// 					proxy.Size = new Vector3(1, 1, 1);

// 					// Offset slightly above the drone handle so the bubble doesn't clip
// 					proxy.CFrame = handle.CFrame.add(new Vector3(0, 1.5, 0));

// 					const weld = new Instance("WeldConstraint");
// 					weld.Part0 = proxy;
// 					weld.Part1 = handle;
// 					weld.Parent = proxy;

// 					proxy.Parent = char; // Must be parented to the Character for TextChatService to find it
// 				}
// 			}
// 		} else {
// 			// Remove the proxy when unfocused, reverting chat to the player
// 			const proxy = char.FindFirstChild("DroneChatProxy");
// 			if (proxy) proxy.Destroy();
// 		}
// 	}

// 	unfocusCameraFeed() {
// 		if (!this.isViewingFeed) return;
// 		this.isViewingFeed = false;
// 		this.setServerViewingState(false);
// 		isDroneFocusing(false);

// 		AnimationUtils.stopAnim(this.viewmodel!, "focus");
// 		if (this.focusTrack) {
// 			this.focusTrack.Stop();
// 			this.focusTrack = undefined;
// 		}

// 		this.unbindDroneControls();
// 		if (this.renderConnection) {
// 			this.renderConnection.Disconnect();
// 			this.renderConnection = undefined;
// 		}

// 		// Clean up the Live Feed Loop
// 		if (this.liveFeedManager) {
// 			this.liveFeedManager.stop();
// 			this.liveFeedManager = undefined;
// 		}

// 		if (this.feedCamera) {
// 			this.feedCamera.Destroy();
// 			this.feedCamera = undefined;
// 		}
// 	}

// 	private setupViewportCamera() {
// 		const remote = this.viewmodel?.FindFirstChild("Droneremote") as Model | undefined;
// 		const displayPart = remote?.FindFirstChild("display") as BasePart;
// 		const player = Players.LocalPlayer;
// 		const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
// 		const surfaceGui = playerGui?.FindFirstChild("DroneGui") as SurfaceGui;
// 		surfaceGui.Adornee = displayPart;
// 		const viewportFrame = surfaceGui?.FindFirstChildOfClass("ViewportFrame");

// 		// print("setting up viewport camera, ", viewportFrame, this.getDroneEntity());
// 		//this is a mistake, there is no drone entity on the client, my bad

// 		const camPart = this.characterDrone?.FindFirstChild("camera") as BasePart | undefined;
// 		if (viewportFrame && camPart) {
// 			this.feedCamera = new Instance("Camera");
// 			this.feedCamera.Name = "FeedCamera";
// 			this.feedCamera.FieldOfView = this.feedFOV;
// 			this.feedCamera.Parent = camPart;
// 			viewportFrame.CurrentCamera = this.feedCamera;

// 			// Add a WorldModel so physics/animations render nicely inside the Viewport
// 			let worldModel = viewportFrame.FindFirstChildOfClass("WorldModel");
// 			if (!worldModel) {
// 				worldModel = new Instance("WorldModel");
// 				worldModel.Parent = viewportFrame;
// 			}

// 			// Initialize and Start Live Feed
// 			this.liveFeedManager = new LiveCameraFeed(viewportFrame, this.feedCamera, {
// 				cameraEye: camPart,
// 				fov: this.feedFOV + 10, // Buffer FOV slightly for seamless popping
// 				cameraRange: 250, // Max render distance in studs
// 				fps: 8, // 30 is a good baseline for Viewports
// 				updateFrequency: 0.1, // Scans Workspace 4 times a second
// 				ignoreModel: this.characterDrone, // Don't render the drone blocking its own camera
// 			});

// 			this.liveFeedManager.start();
// 		}
// 	}

// 	// ==========================================
// 	// Movement Logic
// 	// ==========================================

// 	private droneUpdateLoop(dt: number) {
// 		if (!this.characterDrone || !this.characterDrone.PrimaryPart) return;

// 		const primary = this.characterDrone.PrimaryPart;
// 		this.hoverTime += dt;

// 		// 1. Update Viewport Camera CFrame
// 		if (this.feedCamera) {
// 			const camPart = this.characterDrone.FindFirstChild("camera") as Part | undefined;
// 			if (camPart) {
// 				this.feedCamera.CFrame = CFrame.lookAt(
// 					camPart.Position,
// 					camPart.Position.add(camPart.CFrame.LookVector.mul(10)),
// 				);
// 			}
// 		}

// 		// 2. Calculate Drone Physics/Movement (Linear)
// 		let moveVector = new Vector3(
// 			this.movementInputs.forward - this.movementInputs.backward,
// 			this.movementInputs.up - this.movementInputs.down,
// 			0,
// 		);

// 		if (moveVector.Magnitude > 0) {
// 			moveVector = moveVector.Unit.mul(DRONE_SPEED);
// 		}

// 		const relativeVelocity = primary.CFrame.VectorToWorldSpace(moveVector);

// 		primary.AssemblyLinearVelocity = primary.AssemblyLinearVelocity.Lerp(relativeVelocity, dt * 10);

// 		// 3. Calculate Angular Velocity (Rotation)
// 		const yawInput = this.movementInputs.left - this.movementInputs.right;
// 		const pitchInput = this.movementInputs.pitchUp - this.movementInputs.pitchDown;

// 		// Since your camera/forward is on the X axis:
// 		// Forward = RightVector (X axis)
// 		// Left = -LookVector (Z axis)
// 		// Right = LookVector (-Z axis)
// 		const forwardVector = primary.CFrame.RightVector;
// 		const rightVector = primary.CFrame.LookVector;

// 		// Calculate pitch and roll safely using vectors (Bypasses Euler angle flipping)
// 		const currentPitch = math.deg(math.asin(math.clamp(forwardVector.Y, -1, 1)));
// 		const currentRoll = math.deg(math.asin(math.clamp(rightVector.Y, -1, 1)));

// 		// --- Roll Stabilization (X axis rotation) ---
// 		// If rightVector.Y is positive, the right side is up -> apply negative roll to flatten
// 		const targetRollVel = -currentRoll * this.rollStabilizeStrength;

// 		// --- Yaw (Y axis rotation) ---
// 		const targetYawVel = yawInput * DRONE_TURN_SPEED;

// 		// --- Pitch (Z axis rotation) ---
// 		let targetPitchVel = pitchInput * this.pitchSpeed;

// 		// Apply the 60-degree clamp
// 		if ((currentPitch >= 60 && targetPitchVel > 0) || (currentPitch <= -60 && targetPitchVel < 0)) {
// 			targetPitchVel = 0; // Stop pitching further if at limit
// 		}

// 		// Construct target velocity in LOCAL space
// 		const localTargetAngularVelocity = new Vector3(targetRollVel, targetYawVel, targetPitchVel);

// 		// Convert to WORLD space for AssemblyAngularVelocity
// 		const worldTargetAngularVelocity = primary.CFrame.VectorToWorldSpace(localTargetAngularVelocity);

// 		const damping = 0.9;
// 		const currentAV = primary.AssemblyAngularVelocity.mul(damping);

// 		primary.AssemblyAngularVelocity = currentAV.Lerp(worldTargetAngularVelocity, dt * 8);
// 	}

// 	private bindDroneControls() {
// 		// Sink inputs so character doesn't move
// 		ContextActionService.BindAction(
// 			"DroneForward",
// 			(_, state) => {
// 				this.movementInputs.forward = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.W,
// 		);
// 		ContextActionService.BindAction(
// 			"DroneBackward",
// 			(_, state) => {
// 				this.movementInputs.backward = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.S,
// 		);
// 		ContextActionService.BindAction(
// 			"DroneLeft",
// 			(_, state) => {
// 				this.movementInputs.left = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.A,
// 		);
// 		ContextActionService.BindAction(
// 			"DroneRight",
// 			(_, state) => {
// 				this.movementInputs.right = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.D,
// 		);
// 		ContextActionService.BindAction(
// 			"DroneUp",
// 			(_, state) => {
// 				this.movementInputs.up = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.Space,
// 		);
// 		ContextActionService.BindAction(
// 			"DroneDown",
// 			(_, state) => {
// 				this.movementInputs.down = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.LeftShift,
// 		);
// 		ContextActionService.BindAction(
// 			"DronePitchUp",
// 			(_, state) => {
// 				this.movementInputs.pitchUp = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.E,
// 		);

// 		ContextActionService.BindAction(
// 			"DronePitchDown",
// 			(_, state) => {
// 				this.movementInputs.pitchDown = state === Enum.UserInputState.Begin ? 1 : 0;
// 				return Enum.ContextActionResult.Sink;
// 			},
// 			false,
// 			Enum.KeyCode.Q,
// 		);
// 	}

// 	private unbindDroneControls() {
// 		ContextActionService.UnbindAction("DroneForward");
// 		ContextActionService.UnbindAction("DroneBackward");
// 		ContextActionService.UnbindAction("DroneLeft");
// 		ContextActionService.UnbindAction("DroneRight");
// 		ContextActionService.UnbindAction("DroneUp");
// 		ContextActionService.UnbindAction("DroneDown");
// 		ContextActionService.UnbindAction("DronePitchUp");
// 		ContextActionService.UnbindAction("DronePitchDown");
// 	}

// 	@Message({ Type: "Event", Destination: "Server" })
// 	stopServerFocusAnim() {
// 		this.focusTrack?.Stop();
// 		this.focusTrack = undefined;
// 	}

// 	startServerHover() {
// 		if (!this.characterDrone || !this.characterDrone.PrimaryPart) return;

// 		if (this.serverHoverConnection) {
// 			this.serverHoverConnection.Disconnect();
// 		}

// 		this.serverHoverConnection = RunService.Heartbeat.Connect((dt) => {
// 			if (!this.characterDrone || !this.characterDrone.PrimaryPart) return;

// 			const primary = this.characterDrone.PrimaryPart;
// 			this.serverHoverTime += dt;

// 			// Only apply passive hover when player is not actively moving vertically
// 			// (you don't have movementInputs on server, so just always apply small offset)
// 			const hoverBob = math.sin(this.serverHoverTime * 3) * 0.8;

// 			const currentVel = primary.AssemblyLinearVelocity;

// 			primary.AssemblyLinearVelocity = new Vector3(
// 				currentVel.X,
// 				currentVel.Y + hoverBob * dt * 5, // scaled so it doesn't explode
// 				currentVel.Z,
// 			);
// 		});
// 	}

// 	startBladeSpin() {
// 		if (!this.characterDrone) return;

// 		const handle = this.characterDrone.FindFirstChild("handle") as MeshPart & {
// 			blade1: Motor6D;
// 			blade2: Motor6D;
// 			blade3: Motor6D;
// 			blade4: Motor6D;
// 		};
// 		if (!handle) return;

// 		const motors: Motor6D[] = [handle.blade1, handle.blade2, handle.blade3, handle.blade4];

// 		if (this.bladeSpinConnection) {
// 			this.bladeSpinConnection.Disconnect();
// 		}

// 		this.bladeSpinConnection = RunService.Heartbeat.Connect((dt) => {
// 			const spinSpeed = dt * 20; // speed (tune this)

// 			motors.forEach((motor, i) => {
// 				if (!motor) return;

// 				// Alternate spin direction for opposite blades (1&3 clockwise, 2&4 counterclockwise)
// 				const direction = i % 2 === 0 ? 1 : -1;
// 				motor.C0 = motor.C0.mul(CFrame.Angles(0, spinSpeed * direction, 0));
// 			});
// 		});
// 	}

// 	getDroneEntity() {
// 		const playerEntity = ref.find(this.Player!);
// 		if (playerEntity === undefined) return undefined;
// 		return world.target(playerEntity, Components.CurrentlyEquipped);
// 	}

// 	protected OnConstructServer(): void {
// 		this.Destroyed.Connect(() => {
// 			this.Player?.Character?.FindFirstChild("DroneChatProxy")?.Destroy();

// 			const itemEntity = this.getDroneEntity();
// 			if (itemEntity !== undefined) {
// 				const droneData = world.get(itemEntity, Components.Drone);
// 				if (droneData && droneData.deployed && this.characterDrone) {
// 					// Player unequipped remote. Let server take over physics.
// 					this.characterDrone.GetDescendants().forEach((desc) => {
// 						if (desc.IsA("BasePart")) desc.SetNetworkOwner(undefined); // nil
// 					});

// 					// Save last known CFrame
// 					world.set(itemEntity, Components.Drone, {
// 						...droneData,
// 						cframe: this.characterDrone.GetPivot(),
// 					});
// 				} else if (!droneData?.deployed && this.characterDrone) {
// 					// If it wasn't deployed, it's just welded to the character. Destroy it.
// 					this.characterDrone.Destroy();
// 				}
// 			}
// 			if (this.Player!.Character!.FindFirstChild("Drone")) {
// 				this.Player!.Character!.FindFirstChild("Drone")!.Destroy();
// 			}
// 		});
// 	}

// 	protected OnConstructClient(): void {
// 		this.Destroyed.Connect(() => {
// 			this.unfocusCameraFeed();
// 			if (this.viewmodelDrone) this.viewmodelDrone.Destroy();
// 		});
// 	}
// }
