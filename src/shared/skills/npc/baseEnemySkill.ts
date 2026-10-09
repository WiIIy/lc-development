// here we go
import { ref } from "@rbxts/jecs-utils";
import Make from "@rbxts/make";
import { Entity } from "@rbxts/jecs";
import { PathfindingService, Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { Character, Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { enemyList } from "shared/atoms";
import { Components } from "shared/components/components";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtil, AnimationUtils } from "shared/utils/animationUtil";
import { getCoverSpotsInRadius } from "shared/utils/getValidCoverSpots";
import world from "shared/world";
import { debugDrawWaypoints } from "shared/utils/drawWaypoints";
import { setDescendantsNetworkOwner } from "shared/utils/setDescendantNetworkOwner";

//essentially a behavior container. ecs systems will call them
//no client code, enemies are serverside
@SkillDecorator
export class BaseEnemySkill extends Skill {
	enemyType: string | undefined;
	protected model: Model | undefined;
	protected enemyEntity: Entity | undefined;
	protected humanoid: Humanoid | undefined;
	protected rootPart: BasePart | undefined;
	protected torso: BasePart | undefined;
	protected head: BasePart | undefined;
	protected wcsCharacter: Character | undefined;
	protected activeLookTarget: Model | undefined;

	// rig Movement State
	protected neck: Motor6D | undefined;
	protected originalNeckC0: CFrame | undefined;

	protected rightShoulder: Motor6D | undefined;
	protected leftShoulder: Motor6D | undefined;

	protected originalRightShoulderC0: CFrame | undefined;
	protected originalLeftShoulderC0: CFrame | undefined;

	protected rightShoulderPitchAxis: Vector3 | undefined;
	protected leftShoulderPitchAxis: Vector3 | undefined;

	MAX_YAW_DEG = 60;
	MAX_PITCH_DEG = 40;
	private readonly MAX_YAW_RAD = math.rad(60);
	private readonly MAX_PITCH_RAD = math.rad(40);

	//connections and pathfinding
	protected lookConnection: RBXScriptConnection | undefined;
	protected distanceConnection: RBXScriptConnection | undefined;
	protected currentPathIndex = 0;
	protected isPathfinding = false;

	//for lerp at stoplooking()
	protected lookAtTarget: Model | undefined = undefined;
	protected isReturningToNeutral = false;
	protected lookAtEndTime: number = 0;

	//pathfinding (is one active, is npc blocked)
	protected activeMoveConn?: RBXScriptConnection;
	protected activeBlockedConn?: RBXScriptConnection;

	// Debug Behavior State
	protected followConnection?: RBXScriptConnection;
	protected hideConnection?: RBXScriptConnection;

	// Hider Cache State
	private lastCoverQueryPosition?: Vector3;
	private cachedCoverSpots: Vector3[] = [];

	//enemy states
	protected movementCancelled = false;
	protected surrendered: boolean = false;

	//client-side anims
	protected walkAnimTrack: AnimationTrack | undefined;
	protected idleAnimTrack: AnimationTrack | undefined;
	protected movementConnection: RBXScriptConnection | undefined;

	//for LOS tracking
	protected lastSeenPosition: Vector3 | undefined;
	protected timeSinceLostLOS: number = 0;
	protected isStalking = false;

	protected omniscient: boolean = false; //enemy knows where player is at all times
	protected wanderConnection?: RBXScriptConnection;
	protected timeLostLOS: number = 0;

	protected OnStartServer(): void {
		this.setupVars();
	}

	private setupVars() {
		this.model = this.Character.Humanoid.Parent as Model;
		// print("spawened", this.model.Name);

		const humanoid = this.Character.Humanoid;
		const root = this.model.FindFirstChild("HumanoidRootPart") as BasePart;
		const torso =
			(this.model.FindFirstChild("Torso") as BasePart) || (this.model.FindFirstChild("UpperTorso") as BasePart);
		const head = this.model.FindFirstChild("Head") as BasePart;

		if (!humanoid || !root || !torso || !head) {
			error(`Enemy model ${this.model.Name} missing standard R6/R15 parts!`);
		}

		this.enemyEntity = ref.find(this.model);
		print("setting enemy entity", this.enemyEntity);
		this.humanoid = humanoid;
		this.rootPart = root;
		this.torso = torso;
		this.head = head;
		this.neck = (this.torso.FindFirstChild("Neck") as Motor6D) || (this.head.FindFirstChild("Neck") as Motor6D);
		this.rightShoulder = this.torso.FindFirstChild("Right Shoulder") as Motor6D;
		this.leftShoulder = this.torso.FindFirstChild("Left Shoulder") as Motor6D;

		if (this.rightShoulder && !this.originalRightShoulderC0) {
			this.originalRightShoulderC0 = this.rightShoulder.C0;
			this.rightShoulderPitchAxis = this.originalRightShoulderC0.VectorToObjectSpace(Vector3.xAxis);
		}

		if (this.leftShoulder && !this.originalLeftShoulderC0) {
			this.originalLeftShoulderC0 = this.leftShoulder.C0;
			this.leftShoulderPitchAxis = this.originalLeftShoulderC0.VectorToObjectSpace(Vector3.xAxis);
		}
		if (this.neck) {
			this.originalNeckC0 = this.neck.C0;
		} else {
			warn("No Neck Motor6D found on enemy.");
		}
	}

	cancelMovement() {
		this.movementCancelled = true;

		this.activeMoveConn?.Disconnect();
		this.activeMoveConn = undefined;

		this.activeBlockedConn?.Disconnect();
		this.activeBlockedConn = undefined;

		this.humanoid?.Move(Vector3.zero);
	}

	walkToPoint(point: Vector3): Promise<void> {
		this.movementCancelled = false;

		if (this.model && !this.humanoid?.Seated) {
			print("network owner is server");
			setDescendantsNetworkOwner(this.model, undefined);
		}

		return new Promise((resolve) => {
			const humanoid = this.humanoid;
			const root = this.rootPart;

			if (!humanoid || !root) return resolve();

			// Let the Humanoid rotate itself toward the destination
			humanoid.AutoRotate = true;
			AnimationUtils.stopAnim(this.model!, "sit");

			const cleanup = () => {
				this.activeMoveConn?.Disconnect();
				this.activeMoveConn = undefined;
				this.activeBlockedConn?.Disconnect();
				this.activeBlockedConn = undefined;
			};

			const compute = () => {
				cleanup();

				const path = PathfindingService.CreatePath({
					AgentRadius: 2,
					AgentHeight: 5,
					AgentCanJump: true,
					AgentCanClimb: true,
					WaypointSpacing: 6,
				});

				path.ComputeAsync(root.Position, point);

				if (path.Status !== Enum.PathStatus.Success) {
					return resolve();
				}

				const waypoints = path.GetWaypoints();
				let currentWaypoint = 1;

				const moveNext = () => {
					if (
						this.movementCancelled ||
						currentWaypoint >= waypoints.size() ||
						this.enemyEntity === undefined
					) {
						cleanup();
						return resolve();
					}

					if (humanoid.Sit) {
						humanoid.Sit = false;
					}
					const waypoint = waypoints[currentWaypoint];

					if (waypoint.Action === Enum.PathWaypointAction.Jump) {
						//prevent jumping out of seat
						if (!humanoid.Sit) {
							humanoid.Jump = true;
						} else {
							print("walktopoint - unseating on exiting seat/jump waypoint");
							humanoid.Sit = false;
						}
					}

					// Calculate separation offset once per waypoint target
					const separation = this.computeSeparation(root.Position, enemyList(), 4.5, 0.7);
					const targetPos = waypoint.Position.add(new Vector3(separation.X, 0, separation.Z));

					// Call MoveTo ONCE per waypoint
					humanoid.MoveTo(targetPos);

					// Listen for arrival via event or distance check
					this.activeMoveConn = humanoid.MoveToFinished.Connect((reached) => {
						this.activeMoveConn?.Disconnect();

						if (!reached) {
							cleanup();
							return resolve();
						}

						currentWaypoint++;
						moveNext();
					});
				};

				moveNext();
			};

			compute();
		});
	}

	//to detect if they're being looked at
	isLookingAtEnemy(player: Player, enemy: Model, fov = 70) {
		const char = player.Character;
		if (!char) return false;

		const root = char.FindFirstChild("HumanoidRootPart") as BasePart;
		const enemyRoot = enemy.FindFirstChild("HumanoidRootPart") as BasePart;

		if (!root || !enemyRoot) return false;

		const lookVector = root.CFrame.LookVector;
		const directionToEnemy = enemyRoot.Position.sub(root.Position).Unit;

		const dot = lookVector.Dot(directionToEnemy);

		return dot > fov;
	}

	//for staring at player if they find them suspicious
	// ==========================================
	// LOS, ALERTNESS, & LOOK AT LOCK
	// ==========================================

	lookAtLock(targetPlayerEntity: Entity, duration: number = 0) {
		const model = world.get(targetPlayerEntity, Components.Model);
		this.lookAtTarget = model;
		this.isReturningToNeutral = false;

		if (duration > 0) {
			this.lookAtEndTime = tick() + duration;
		} else {
			this.lookAtEndTime = math.huge;
		}

		if (this.lookConnection) return;

		this.lookConnection = RunService.Heartbeat.Connect((dt) => {
			if (!this.rootPart || !this.neck || !this.originalNeckC0 || this.enemyEntity === undefined) {
				this.cleanupLookConnection();
				return;
			}

			const currentTransform = world.get(this.enemyEntity, Components.Transform);
			if (!currentTransform) return;
			const myPos = currentTransform.Position;

			const currentAlertness = world.get(this.enemyEntity, Components.Alertness) ?? 0;
			const targetRoot = world.get(targetPlayerEntity, Components.Basepart);
			if (!targetRoot) return;

			const followsPlayer = world.has(this.enemyEntity, Components.Following);
			const isSuspicious = currentAlertness > 20 && currentAlertness <= 50;
			const isCombat = currentAlertness > 50;

			const shouldRotateBody = isCombat || followsPlayer !== undefined;
			// print("should rotate ", shouldRotateBody, " iscombat ", isCombat, " followplayer ", followsPlayer);

			let hasLOS = false;
			if (targetRoot) {
				const params = new RaycastParams();
				params.FilterDescendantsInstances = [this.model!];
				params.FilterType = Enum.RaycastFilterType.Exclude;
				const ray = Workspace.Raycast(myPos, targetRoot.Position.sub(myPos), params);
				hasLOS = ray !== undefined && ray.Instance.IsDescendantOf(this.lookAtTarget!);
			}

			//this stops enemy from looking at player through walls once they lost track (startfollowingtarget) behavior
			const effectiveLOS = hasLOS || this.omniscient;

			// Head tracking visual logic
			let goalNeckC0 = this.originalNeckC0;
			let goalBodyCF: CFrame | undefined = undefined;

			// Look at either the player (if LOS) or the last place we saw them
			const lookPos = effectiveLOS && targetRoot && targetRoot ? targetRoot.Position : this.lastSeenPosition;

			let targetPitch = 0;
			let targetYaw = 0;

			if (lookPos) {
				const dir = lookPos.sub(this.rootPart.Position).Unit;
				const localLook = this.rootPart.CFrame.VectorToObjectSpace(dir);

				const yaw = math.atan2(-localLook.X, -localLook.Z);
				const pitch = math.asin(math.clamp(localLook.Y, -1, 1));

				const clampedYaw = math.clamp(yaw, -this.MAX_YAW_RAD, this.MAX_YAW_RAD);
				targetPitch = math.clamp(pitch, -this.MAX_PITCH_RAD, this.MAX_PITCH_RAD);

				if (shouldRotateBody) {
					// Prevent the body from tracking the target if we are actively walking
					// This allows the head/arms to aim at the player while the body faces the path
					const isMoving =
						this.activeMoveConn !== undefined ||
						this.followConnection !== undefined ||
						this.distanceConnection !== undefined;

					if (!isMoving || followsPlayer) {
						targetYaw = 0;
						const flatLook = new Vector3(lookPos.X, myPos.Y, lookPos.Z);
						goalBodyCF = CFrame.lookAt(myPos, flatLook);
					} else {
						targetYaw = clampedYaw; // Let the neck track the player while running
					}
				} else {
					targetYaw = clampedYaw;
				}
			}
			// else if (currentAlertness > 20 && currentAlertness <= 50 && !this.lookAtTarget) {
			// 	// Procedural Head Sway if investigating and nothing locked
			// 	const cycle = tick() % 9;
			// 	if (cycle < 4) {
			// 		// Sine wave left to right over 4 seconds
			// 		targetYaw = math.sin((cycle / 4) * math.pi * 2) * (this.MAX_YAW_RAD * 0.8);
			// 	}
			// }

			goalNeckC0 = this.originalNeckC0.mul(CFrame.Angles(-targetPitch, 0, targetYaw));

			// Call updateArms every frame to ensure smooth lerping!
			this.updateArms(targetPitch, isCombat);

			// Check if timer expired (only if we have a valid look target)
			if (this.lookAtTarget && tick() >= this.lookAtEndTime) {
				this.stopLooking();
			}

			const lerpSpeed = this.lookAtTarget || (currentAlertness <= 50 && currentAlertness > 20) ? 10 : 3;
			this.neck.C0 = this.neck.C0.Lerp(goalNeckC0, lerpSpeed * dt);

			if (goalBodyCF) {
				world.set(this.enemyEntity, Components.Transform, currentTransform.Lerp(goalBodyCF, 5 * dt));
			}

			if (!this.lookAtTarget && currentAlertness <= 50 && currentAlertness > 20) {
				const rotDist = math.acos(
					math.clamp(this.neck.C0.LookVector.Dot(this.originalNeckC0.LookVector), -1, 1),
				);
				if (rotDist < 0.01) {
					this.neck.C0 = this.originalNeckC0;
					this.cleanupLookConnection();
				}
			}
		});
	}

	stopLooking() {
		this.lookAtTarget = undefined;
		this.isReturningToNeutral = true;

		this.cleanupLookConnection();
	}

	private cleanupLookConnection() {
		if (this.lookConnection) {
			this.lookConnection.Disconnect();
			this.lookConnection = undefined;
		}
	}

	public updateArms(pitch: number, isAiming: boolean = false) {
		if (!this.rightShoulder || !this.leftShoulder || !this.originalRightShoulderC0 || !this.originalLeftShoulderC0)
			return;

		let armPitch = 0;

		// Similar to HeadMovementHandler: Full pitch if aiming, otherwise only angle downwards.
		if (isAiming) {
			armPitch = pitch;
		} else if (pitch < 0) {
			armPitch = math.max(pitch, -math.rad(90));
		}

		const rightRot = CFrame.fromAxisAngle(this.rightShoulderPitchAxis!, armPitch);
		const leftRot = CFrame.fromAxisAngle(this.leftShoulderPitchAxis!, armPitch);

		const targetRight = this.originalRightShoulderC0.mul(rightRot);
		const targetLeft = this.originalLeftShoulderC0.mul(leftRot);

		this.rightShoulder.C0 = this.rightShoulder.C0.Lerp(targetRight, 0.25);
		this.leftShoulder.C0 = this.leftShoulder.C0.Lerp(targetLeft, 0.25);
	}

	computeSeparation(selfPos: Vector3, enemies: Model[], radius = 4.5, maxForce = 0.85) {
		let force = Vector3.zero;
		let neighborCount = 0;

		for (const enemy of enemies) {
			const root = enemy.PrimaryPart;
			if (!root) continue;

			const offset = selfPos.sub(root.Position);
			const dist = offset.Magnitude;

			// Ignore self (dist > 0.1) and only react to those in radius
			if (dist > 0.1 && dist < radius) {
				// The closer they are, the stronger the push (1 at 0 studs, 0 at radius edge)
				const pushStrength = 1 - dist / radius;
				force = force.add(offset.Unit.mul(pushStrength));
				neighborCount++;
			}
		}

		// Average the force so being in a crowd of 10 doesn't equal 10x the push
		if (neighborCount > 0) {
			force = force.div(neighborCount);

			// Hard clamp the max influence
			if (force.Magnitude > maxForce) {
				force = force.Unit.mul(maxForce);
			}
		}

		return force;
	}

	/**
	 * Civilian-specific pursue behavior
	 * Chases player at full speed until they lose LOS and go below "suspicious" alertness
	 */
	startPursuingPlayer(target: Model): void {
		this.stopFollowing();

		let waypoints: PathWaypoint[] = [];
		let waypointIndex = 0;
		let hasDirectPath = false;
		let timeSinceLostLOS = 0;

		// 1. THE LEGS
		this.followConnection = RunService.Heartbeat.Connect((dt) => {
			if (!target || !target.PrimaryPart || !this.rootPart || !this.humanoid) return;

			const targetPos = target.PrimaryPart.Position;
			const entity = ref.find(this.model!);

			if (this.lastSeenPosition) {
				this.lookAtTarget = target;
			}

			if (hasDirectPath) {
				this.stepTransformTowards(targetPos, this.humanoid.WalkSpeed, dt);
			} else if (waypoints.size() > 0 && waypointIndex < waypoints.size()) {
				const arrived = this.stepTransformTowards(
					waypoints[waypointIndex].Position,
					this.humanoid.WalkSpeed,
					dt,
				);
				if (arrived) waypointIndex++;
			} else if (this.lastSeenPosition && entity) {
				// Arrived at last seen location, stand still and look at target
				const myPos = world.get(entity, Components.Transform)?.Position ?? this.rootPart.Position;
				const flatLook = new Vector3(targetPos.X, myPos.Y, targetPos.Z);

				if (flatLook.sub(myPos).Magnitude > 0.05) {
					world.set(entity, Components.Transform, CFrame.lookAt(myPos, flatLook));
				}
			}
		});

		const currentConnection = this.followConnection;

		task.spawn(() => {
			while (this.followConnection === currentConnection && target && this.rootPart) {
				const targetPart = target.FindFirstChild("HumanoidRootPart")! as BasePart;
				const targetPos = targetPart.Position;
				const myPos = this.rootPart.Position;

				const hasLOS = this.omniscient || this.hasLOSToTarget(target);

				if (hasLOS) {
					print("enemy has los");
					this.stopWandering();
					timeSinceLostLOS = 0;
					this.lastSeenPosition = targetPos;

					const path = PathfindingService.CreatePath({
						AgentRadius: 3,
						AgentHeight: 5,
						AgentCanJump: true,
					});
					path.ComputeAsync(myPos, targetPos);

					if (path.Status === Enum.PathStatus.Success && path.GetWaypoints().size() <= 2) {
						hasDirectPath = true;
					} else {
						hasDirectPath = false;
						waypoints = path.GetWaypoints();
						waypointIndex = 1;
					}
				} else {
					print("enemy dont have");
					timeSinceLostLOS += 1;
					hasDirectPath = false;

					const entity = ref.find(this.model!);
					const alertness = entity !== undefined ? world.get(entity, Components.Alertness) : 0;

					// Wait until alertness drops to stop pursuing
					if (alertness !== undefined && alertness < 50) {
						this.stopFollowing();
						this.startWandering();
						return;
					}

					if (this.lastSeenPosition) {
						const path = PathfindingService.CreatePath({
							AgentRadius: 3,
							AgentHeight: 5,
							AgentCanJump: true,
						});
						path.ComputeAsync(myPos, this.lastSeenPosition);
						if (path.Status === Enum.PathStatus.Success) {
							waypoints = path.GetWaypoints();
							waypointIndex = 1;
						}
					}
				}
				task.wait(1);
			}
		});
	}

	private isDirectPathSafe(targetPos: Vector3): boolean {
		if (!this.rootPart) return false;

		const myPos = this.rootPart.Position;
		const direction = targetPos.sub(myPos);
		const distance = direction.Magnitude;

		// 1. Line of Sight Check
		const rayParams = new RaycastParams();
		rayParams.FilterDescendantsInstances = [this.model!];
		rayParams.FilterType = Enum.RaycastFilterType.Exclude;

		const losHit = Workspace.Raycast(myPos, direction, rayParams);
		const hasLOS = !losHit || (losHit.Instance && losHit.Instance.IsDescendantOf(this.model!));

		if (!hasLOS) return false;

		// 2. Pathfinding Check - verify the path exists and is direct (2 waypoints = direct)
		const path = PathfindingService.CreatePath({
			AgentRadius: 3,
			AgentHeight: 5,
			AgentCanJump: true,
			AgentCanClimb: true,
			WaypointSpacing: 6,
		});

		path.ComputeAsync(myPos, targetPos);

		if (path.Status !== Enum.PathStatus.Success) {
			return false; // Path not computable
		}

		const waypoints = path.GetWaypoints();
		// Direct path = 2 waypoints (start + end), or very close (< 0.5 distance)
		const isDirect = waypoints.size() <= 2 || distance < 0.5;

		return isDirect;
	}

	getPositionFromTarget(target: Model | Vector3): Vector3 | undefined {
		if (typeIs(target, "Vector3")) return target;
		return (target as Model).PrimaryPart?.Position;
	}

	surrender() {
		this.surrendered = true;
		print("enemy surrendered");
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	clientExecuteServerCode() {}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}

	protected OnConstructServer(): void {}

	protected OnConstructClient(): void {}

	//-------- DEBUG MOVEMENT BEHAVIORS ---------//
	// THE FOLLOWER
	// startFollowingTarget(targetPlayerEntity: Entity, stopRadius = 6) {
	// 	print("enemy is following target ", targetPlayerEntity, " with stop radius ", stopRadius);

	// 	this.stopFollowingTarget();
	// 	this.stopWandering();

	// 	this.lookAtLock(targetPlayerEntity);

	// 	let waypoints: PathWaypoint[] = [];
	// 	let waypointIndex = 0;
	// 	let hasDirectPath = false;
	// 	let timeSinceLastSeen = 0;
	// 	let lastSeenPosition: Vector3 | undefined = undefined;
	// 	let hadLOSLastFrame = false;
	// 	let hasLOS = false;

	// 	// 1. THE LEGS (Lightweight Movement Loop)

	// 	this.followConnection = RunService.Heartbeat.Connect((dt) => {
	// 		if (targetPlayerEntity === undefined || !this.humanoid) return;

	// 		const targetModel = world.get(targetPlayerEntity, Components.Model);
	// 		const targetHrp = world.get(targetPlayerEntity, Components.Basepart);
	// 		if (!targetModel || !targetHrp) return;
	// 		const entity = this.enemyEntity;
	// 		if (entity === undefined) return;

	// 		hasLOS = this.omniscient || this.hasLOSToTarget(targetModel);

	// 		if (hasLOS) {
	// 			lastSeenPosition = targetHrp.Position;
	// 		}
	// 		// Detect exact moment LOS is lost

	// 		if (hadLOSLastFrame && !hasLOS) {
	// 			// This is the EXACT last visible frame
	// 			timeSinceLastSeen = 0;
	// 			hasDirectPath = false;
	// 		}

	// 		hadLOSLastFrame = hasLOS;
	// 		const targetPos = this.omniscient || hasLOS ? targetHrp.Position : lastSeenPosition;

	// 		if (!targetPos) return;

	// 		const myPos = world.get(entity, Components.Transform)?.Position ?? this.rootPart!.Position;
	// 		const flatTarget = new Vector3(targetPos.X, myPos.Y, targetPos.Z);
	// 		const distToTarget = flatTarget.sub(myPos).Magnitude;

	// 		//so enemies dont stop pursuing where-player-was-last-seen positions when detecting that player is close to them behind the wall
	// 		const activeStopRadius = hasLOS || this.omniscient ? stopRadius : 1.5;

	// 		if (distToTarget <= activeStopRadius) return;

	// 		if (hasDirectPath) {
	// 			print("enemy has direct path, steptransformtowards");

	// 			this.stepTransformTowards(targetPos, this.humanoid.WalkSpeed, dt);
	// 		} else if (waypoints.size() > 0 && waypointIndex < waypoints.size()) {
	// 			print("enemy pathfinding, steptransformtowards + pathfinding");
	// 			//they get stuck here real often

	// 			const wp = waypoints[waypointIndex];
	// 			const arrived = this.stepTransformTowards(wp.Position, this.humanoid.WalkSpeed, dt);

	// 			if (arrived) waypointIndex++;
	// 		}
	// 	});

	// 	const currentConnection = this.followConnection;

	// 	// 2. THE BRAIN (Heavy Decision Loop)

	// 	task.spawn(() => {
	// 		while (this.followConnection === currentConnection && targetPlayerEntity !== undefined && this.rootPart) {
	// 			const currentHasLOS = hasLOS;
	// 			const targetHrp = world.get(targetPlayerEntity, Components.Basepart);

	// 			if (!lastSeenPosition || !targetHrp) {
	// 				task.wait(0.2);

	// 				continue;
	// 			}

	// 			const targetPos = currentHasLOS ? targetHrp.Position : lastSeenPosition;

	// 			const myPos = this.rootPart.Position;

	// 			if (currentHasLOS) {
	// 				print("enemy has los, pathing");

	// 				timeSinceLastSeen = 0;

	// 				// Pathability check: Is the LOS path actually walkable?

	// 				const path = PathfindingService.CreatePath({
	// 					AgentRadius: 1.5,

	// 					AgentHeight: 5,

	// 					AgentCanJump: true,
	// 				});

	// 				path.ComputeAsync(myPos, targetPos);

	// 				if (path.Status === Enum.PathStatus.Success && path.GetWaypoints().size() <= 2) {
	// 					hasDirectPath = true;
	// 				} else {
	// 					hasDirectPath = false;

	// 					waypoints = path.GetWaypoints();
	// 					debugDrawWaypoints(waypoints);

	// 					waypointIndex = 1;
	// 				}
	// 			} else {
	// 				if (!lastSeenPosition) continue;

	// 				const distToMemory = lastSeenPosition.sub(myPos).Magnitude;

	// 				//enemy approaches last point player was seen before they start wandering

	// 				if (distToMemory > 1.5) {
	// 					const path = PathfindingService.CreatePath({
	// 						AgentRadius: 1.5,
	// 						AgentHeight: 5,
	// 						AgentCanJump: true,
	// 					});

	// 					path.ComputeAsync(myPos, lastSeenPosition);

	// 					if (path.Status === Enum.PathStatus.Success) {
	// 						hasDirectPath = false;
	// 						waypoints = path.GetWaypoints();
	// 						waypointIndex = 1;

	// 						// If we have a last seen position, go there first
	// 					}

	// 					continue;
	// 				}

	// 				// only now start counting
	// 				timeSinceLastSeen += 1;
	// 				hasDirectPath = false;

	// 				// At this point, we've reached last seen position (or had none)
	// 				// Now apply memory decay

	// 				if (timeSinceLastSeen >= 2 && !this.omniscient) {
	// 					this.stopFollowingTarget();
	// 					this.stopLooking();
	// 					this.startWandering();

	// 					if (this.enemyEntity !== undefined) {
	// 						print("target lost");
	// 						world.remove(this.enemyEntity, Components.Target);
	// 					}

	// 					return;
	// 				}
	// 			}

	// 			task.wait(1);
	// 		}
	// 	});
	// }

	//not even called
	// startFollowingTarget(targetPlayerEntity: Entity) {
	// 	if (this.enemyEntity === undefined) return;

	// 	world.set(this.enemyEntity, Components.Target, targetPlayerEntity);
	// 	world.set(this.enemyEntity, Components.LookAtTarget, targetPlayerEntity);
	// 	print(world.has(this.enemyEntity, Components.LookAtTarget));
	// 	world.set(this.enemyEntity, Components.NextPathTime, 0); // Trigger path immediately
	// }

	// stopFollowingTarget() {
	// 	if (this.enemyEntity === undefined) return;

	// 	world.remove(this.enemyEntity, Components.Target);
	// 	world.remove(this.enemyEntity, Components.Path);
	// 	world.remove(this.enemyEntity, Components.LookAtTarget);
	// }

	// stopFollowingTarget() {
	// 	print("stop following");
	// 	if (this.followConnection) {
	// 		this.followConnection.Disconnect();
	// 		this.followConnection = undefined;
	// 	}
	// 	this.isStalking = false; // Reset the stalker flag
	// 	this.cancelMovement(); // Ensure the humanoid halts

	// 	this.stopLooking();
	// }

	//== THE STALKER

	startStalking(target: Model) {
		this.isStalking = true;
		this.stopFollowing();
		this.stopWandering();

		let waypoints: PathWaypoint[] = [];
		let waypointIndex = 0;
		let hasDirectPath = false;
		let timeSinceLastSeen = 0;

		const STALK_SPEED = (this.humanoid?.WalkSpeed ?? 16) * 0.4;

		this.followConnection = RunService.Heartbeat.Connect((dt) => {
			if (!target || !target.PrimaryPart || !this.humanoid || !this.isStalking) return;
			if (this.enemyEntity === undefined) return;

			const targetPos = target.PrimaryPart.Position;
			const myPos = world.get(this.enemyEntity, Components.Transform)?.Position ?? this.rootPart!.Position;
			const distToTarget = myPos.sub(targetPos).Magnitude;

			const hasLOS = this.omniscient || this.hasLOSToTarget(target);

			if (distToTarget <= 10 && hasLOS) {
				const flatLook = new Vector3(targetPos.X, myPos.Y, targetPos.Z);
				if (flatLook.sub(myPos).Magnitude > 0.05) {
					world.set(this.enemyEntity, Components.Transform, CFrame.lookAt(myPos, flatLook));
				}
				return;
			}

			if (hasDirectPath) {
				this.stepTransformTowards(targetPos, STALK_SPEED, dt);
			} else if (waypoints.size() > 0 && waypointIndex < waypoints.size()) {
				const wp = waypoints[waypointIndex];
				const arrived = this.stepTransformTowards(wp.Position, STALK_SPEED, dt);
				if (arrived) waypointIndex++;
			}
		});

		const currentConnection = this.followConnection;

		task.spawn(() => {
			while (this.followConnection === currentConnection && target && target.PrimaryPart && this.rootPart) {
				const targetPos = target.PrimaryPart.Position;
				const myPos = this.rootPart.Position;

				const hasLOS = this.omniscient || this.hasLOSToTarget(target);

				if (hasLOS) {
					timeSinceLastSeen = 0;
					const path = PathfindingService.CreatePath({ AgentRadius: 3, AgentHeight: 5, AgentCanJump: true });
					path.ComputeAsync(myPos, targetPos);

					if (path.Status === Enum.PathStatus.Success && path.GetWaypoints().size() <= 2) {
						hasDirectPath = true;
					} else {
						hasDirectPath = false;
						waypoints = path.GetWaypoints();
						waypointIndex = 1;
					}
				} else {
					timeSinceLastSeen += 1;
					hasDirectPath = false;

					if (timeSinceLastSeen >= 2 && !this.omniscient) {
						// this.stopFollowingTarget(); // Resets stalking flag
						this.startWandering();
						return;
					}

					const path = PathfindingService.CreatePath({ AgentRadius: 3, AgentHeight: 5, AgentCanJump: true });
					path.ComputeAsync(myPos, targetPos);
					if (path.Status === Enum.PathStatus.Success) {
						waypoints = path.GetWaypoints();
						waypointIndex = 1;
					}
				}
				task.wait(1);
			}
		});
	}

	//== THE DISTANCER

	startMaintainingDistance(target: Model, minDist = 10, maxDist = 20) {
		this.stopMaintainingDistance();
		this.stopWandering();

		let lastSightCheck = 0;
		let hasLOS = true;
		let timeSinceLastSeen = 0;
		let edgeLookDir = Vector3.zero;

		let stuckTimer = 0;
		let lastPos = this.rootPart?.Position || Vector3.zero;
		let escapeVector: Vector3 | undefined;

		this.distanceConnection = RunService.Heartbeat.Connect((dt) => {
			if (!target.PrimaryPart || !this.humanoid) return;
			if (this.enemyEntity === undefined) return;

			const myPos = world.get(this.enemyEntity, Components.Transform)?.Position ?? this.rootPart!.Position;
			const targetPos = target.PrimaryPart.Position;
			const dist = myPos.sub(targetPos).Magnitude;
			const now = tick();

			if (now - lastSightCheck > 1) {
				lastSightCheck = now;
				hasLOS = this.omniscient || this.hasLOSToTarget(target);

				if (!hasLOS) {
					timeSinceLastSeen += 1;
					if (timeSinceLastSeen >= 2 && !this.omniscient) {
						this.stopMaintainingDistance();
						this.startWandering();
						return;
					}

					// Edge checking logic for LOS loss
					const params = new RaycastParams();
					params.FilterDescendantsInstances = [this.model!];
					params.FilterType = Enum.RaycastFilterType.Exclude;
					const rayResult = Workspace.Raycast(myPos, targetPos.sub(myPos), params);

					if (rayResult && rayResult.Instance) {
						const wall = rayResult.Instance;
						const wallRight = wall.CFrame.RightVector.mul(wall.Size.X / 2);
						const rightEdge = wall.Position.add(wallRight);
						const leftEdge = wall.Position.sub(wallRight);

						const distToRight = myPos.sub(rightEdge).Magnitude;
						const distToLeft = myPos.sub(leftEdge).Magnitude;

						const closestEdge = distToRight < distToLeft ? rightEdge : leftEdge;
						edgeLookDir = new Vector3(closestEdge.X - myPos.X, 0, closestEdge.Z - myPos.Z).Unit;
					}
				} else {
					timeSinceLastSeen = 0;
				}
			}

			if (!hasLOS) {
				world.set(this.enemyEntity, Components.Transform, CFrame.lookAt(myPos, myPos.add(edgeLookDir)));
				return;
			}

			const lookAtPos = new Vector3(targetPos.X, myPos.Y, targetPos.Z);
			world.set(this.enemyEntity, Components.Transform, new CFrame(myPos, lookAtPos));

			// 3. Fix: Only increment stuckTimer if we are OUTSIDE the sweet spot
			const isTryingToMove = dist < minDist || dist > maxDist;

			if (isTryingToMove) {
				stuckTimer += dt;
				if (stuckTimer > 0.5) {
					const movedDist = myPos.sub(lastPos).Magnitude;
					if (movedDist < 0.5) {
						escapeVector = myPos.sub(targetPos).Cross(Vector3.yAxis).Unit;
					} else {
						escapeVector = undefined;
					}
					lastPos = myPos;
					stuckTimer = 0;
				}
			} else {
				stuckTimer = 0; // Reset timer because we are happily standing still
				escapeVector = undefined;
			}

			const SPEED = this.humanoid.WalkSpeed;

			if (escapeVector) {
				this.stepTransformTowards(myPos.add(escapeVector), SPEED, dt);
			} else if (dist < minDist) {
				const dirAway = myPos.sub(targetPos).Unit;
				this.stepTransformTowards(myPos.add(dirAway), SPEED, dt);
			} else if (dist > maxDist) {
				const dirTowards = targetPos.sub(myPos).Unit;
				this.stepTransformTowards(myPos.add(dirTowards), SPEED, dt);
			}
		});
	}

	stopMaintainingDistance() {
		if (this.distanceConnection) {
			this.distanceConnection.Disconnect();
			this.distanceConnection = undefined;
		}
		if (this.humanoid) {
			this.humanoid.AutoRotate = true; // Give rotation control back to core movement
			this.humanoid.Move(Vector3.zero);
		}
	}

	//== THE HIDER

	startHiding(targetPlayer: Player) {
		this.stopHiding(); // Clear existing loops

		let isMovingToCover = false;
		let lastSightCheck = 0;

		this.hideConnection = RunService.Heartbeat.Connect(() => {
			if (!targetPlayer.Character || !targetPlayer.Character.PrimaryPart || !this.rootPart) return;

			const now = tick();
			// Debounce to 1 second and don't re-raycast if already moving to cover
			if (now - lastSightCheck > 1 && !isMovingToCover) {
				lastSightCheck = now;

				const myPos = this.rootPart.Position;
				const targetPos = targetPlayer.Character.PrimaryPart.Position;

				const params = new RaycastParams();
				params.FilterDescendantsInstances = [this.model!];
				params.FilterType = Enum.RaycastFilterType.Exclude;

				const rayResult = Workspace.Raycast(myPos, targetPos.sub(myPos), params);
				const hasLOS =
					rayResult && rayResult.Instance && rayResult.Instance.IsDescendantOf(targetPlayer.Character);

				if (hasLOS) {
					isMovingToCover = true; // Lock state

					task.spawn(async () => {
						this.cachedCoverSpots = getCoverSpotsInRadius(targetPlayer, this.model!);

						if (this.cachedCoverSpots.size() > 0) {
							let bestSpot: Vector3 | undefined = undefined;
							let minPathLength = math.huge;

							// Compute path distances for all potential cover spots
							const results: Array<{
								spot: Vector3;
								length: number | undefined;
							}> = [];

							for (const spot of this.cachedCoverSpots) {
								const length = await getPathLength(this.model!, myPos, spot);
								results.push({ spot, length });
							}

							for (const result of results) {
								if (result.length !== undefined && result.length < minPathLength) {
									minPathLength = result.length;
									bestSpot = result.spot;
								}
							}

							if (bestSpot) {
								await this.walkToPoint(bestSpot);
							}
						}
						isMovingToCover = false; // Unlock state after arriving
					});
				}
			}
		});
	}

	stopHiding() {
		if (this.hideConnection) {
			this.hideConnection.Disconnect();
			this.hideConnection = undefined;
		}
		this.cancelMovement();
	}

	resolveWallFacing() {
		if (!this.rootPart || !this.head || !this.model) return;

		const origin = this.head.Position;
		const rootCF = this.rootPart.CFrame;

		// Use the RootPart's vectors to ensure the raycasts are perfectly horizontal
		const forwardVec = rootCF.LookVector;
		const rightVec = rootCF.RightVector;
		const leftVec = rightVec.mul(-1);
		const backVec = forwardVec.mul(-1);

		const params = new RaycastParams();
		params.FilterDescendantsInstances = [this.model];
		params.FilterType = Enum.RaycastFilterType.Exclude;

		// 1. Check Forward (Distance < 1 stud)
		const hitFwd = Workspace.Raycast(origin, forwardVec.mul(10), params);
		// print("wall", hitFwd);
		if (!hitFwd) return; // No wall within 1 stud, we're good to stay as is.

		// 2. Wall detected. Cast in the other 3 directions.
		const MAX_CAST_DIST = 5; // Cast out 5 studs to get a good measurement

		const directions = [
			{ name: "Right", vec: rightVec, dist: MAX_CAST_DIST },
			{ name: "Left", vec: leftVec, dist: MAX_CAST_DIST },
			{ name: "Back", vec: backVec, dist: MAX_CAST_DIST },
		];

		for (const dir of directions) {
			const hit = Workspace.Raycast(origin, dir.vec.mul(MAX_CAST_DIST), params);
			if (hit) {
				dir.dist = hit.Distance;
				// print(dir.dist);
			}
		}

		// 3. Filter for directions with more than 2 studs of clearance
		const validDirs = directions.filter((d) => d.dist > 4);
		// print(validDirs);

		let chosenDir;
		if (validDirs.size() > 0) {
			// Pick randomly from the valid options
			chosenDir = validDirs[math.random(0, validDirs.size() - 1)];
		} else {
			// Fallback: Pick the direction with the absolute longest distance
			directions.sort((a, b) => a.dist > b.dist); // Sort descending
			chosenDir = directions[0];
			print(chosenDir);
		}

		// 4. Apply the rotation
		// Replace the TweenService logic at the bottom of resolveWallFacing with this:
		// 4. Apply the rotation using Humanoid movement logic
		const flatLook = new Vector3(chosenDir.vec.X, 0, chosenDir.vec.Z).Unit;

		// Point 2 studs directly ahead of the NPC in the chosen direction
		const lookAtTarget = this.rootPart.Position.add(flatLook.mul(2));

		// Turn AutoRotate back on if it was toggled off, then signal Humanoid to face the point
		if (this.humanoid) {
			this.humanoid.AutoRotate = true;
			this.humanoid.MoveTo(lookAtTarget);
		}
	}

	async fleeFrom(target: Model) {
		this.cancelMovement();

		const walkPointsFolder = Workspace.FindFirstChild("TestMap")?.FindFirstChild("WalkPoints");
		if (!walkPointsFolder) return;

		const attachments = walkPointsFolder.GetChildren().filter((v) => v.IsA("Attachment")) as Attachment[];
		if (attachments.size() === 0) return;

		const targetPos = target.PrimaryPart?.Position;
		if (!targetPos) return;

		// Find the WalkPoint FURTHEST from the target
		let furthestPoint: Vector3 | undefined;
		let maxDist = 0;

		for (const wp of attachments) {
			const dist = wp.WorldPosition.sub(targetPos).Magnitude;
			if (dist > maxDist) {
				maxDist = dist;
				furthestPoint = wp.WorldPosition;
			}
		}

		if (furthestPoint) {
			await this.walkToPoint(furthestPoint);
		}
	}

	protected stepTransformTowards(waypointPos: Vector3, speed: number, dt: number): boolean {
		const entity = ref.find(this.model!);
		if (entity === undefined) return false;

		const currentTransform = world.get(entity, Components.Transform);
		if (!currentTransform || !this.rootPart) return false;

		const rootPos = currentTransform.Position;

		if (!rootPos) {
			print("Root pos not finite, failure");
			return false; // or reset position
		}

		// 1. Horizontal Target Check
		const flatTarget = new Vector3(waypointPos.X, rootPos.Y, waypointPos.Z);
		const flatDistance = flatTarget.sub(rootPos).Magnitude;

		if (flatDistance < 0.5) return true;

		// 2. Move Horizontally
		const delta = flatTarget.sub(rootPos);
		const goalDir = delta.Magnitude > 1e-4 ? delta.Unit : Vector3.zero;

		const finalDirVec = goalDir;
		const finalDir = finalDirVec.Magnitude < 0.001 ? goalDir : finalDirVec.Unit;
		const stepDist = math.min(speed * dt, flatDistance);

		const newFlatPos = rootPos.add(finalDir.mul(stepDist));

		// 3. Ground Raycast for the Y-Axis
		const yOffset =
			this.humanoid?.RigType === Enum.HumanoidRigType.R15
				? this.humanoid.HipHeight + this.rootPart.Size.Y / 2
				: 3;

		// FIX: Cast from higher up, and cast further down to handle steep drops (Issue 3)
		const rayOrigin = new Vector3(newFlatPos.X, rootPos.Y + 10, newFlatPos.Z);
		const params = new RaycastParams();

		// FIX: Prevent stepping on the player or other enemies (Issue 1)
		const ignoreList: Instance[] = [];
		const enemyContainer = Workspace.FindFirstChild("EnemyContainer");
		if (enemyContainer) ignoreList.push(enemyContainer); // Ignore all other enemies
		for (const player of Players.GetPlayers()) {
			if (player.Character) ignoreList.push(player.Character); // Ignore all players
		}
		ignoreList.push(this.model!);

		params.FilterDescendantsInstances = ignoreList;
		params.FilterType = Enum.RaycastFilterType.Exclude;

		// Cast down 50 studs instead of 15
		const floorHit = Workspace.Raycast(rayOrigin, Vector3.yAxis.mul(-50), params);

		// If floor found, snap to it. Otherwise, maintain current height.
		const newY =
			floorHit && floorHit.Position.Y === floorHit.Position.Y ? floorHit.Position.Y + yOffset : rootPos.Y;
		const newPos = new Vector3(newFlatPos.X, newY, newFlatPos.Z);

		// 4. Apply 3D CFrame
		const flatLook = new Vector3(finalDir.X, 0, finalDir.Z);

		// FIX: Protect against NaN CFrame generation
		if (newPos && flatLook && flatLook.Magnitude > 1e-4) {
			world.set(entity, Components.Transform, CFrame.lookAt(newPos, newPos.add(flatLook)));
		}

		return false;
	}

	setOmniscient(omniscient: boolean): void {
		this.omniscient = omniscient;
	}

	startWandering(): void {
		this.stopWandering();

		const walkPointsFolder = Workspace.FindFirstChild("TestMap")?.FindFirstChild("WalkPoints");
		if (!walkPointsFolder) return;

		const getRandomWalkPoint = (): Vector3 | undefined => {
			const attachments = walkPointsFolder!.GetChildren().filter((v) => v.IsA("Attachment")) as Attachment[];
			if (attachments.size() === 0) return undefined;

			const randomAttachment = attachments[math.random(0, attachments.size() - 1)];
			const basePos = randomAttachment.WorldPosition;

			// Add random offset (up to 3 studs in any horizontal direction) so NPCs don't stand mechanically in one spot
			const offset = new Vector3(math.random(-3, 3) * 0.1, 0, math.random(-3, 3) * 0.1);
			return basePos.add(offset);
		};

		this.wanderConnection = RunService.Heartbeat.Connect(() => {
			if (!this.rootPart) {
				this.stopWandering();
				return;
			}

			// Randomly decide to walk to a new point
			if (math.random() < 0.005) {
				// 2% chance per frame to pick a new point
				const nextPoint = getRandomWalkPoint();
				if (nextPoint) {
					task.spawn(async () => {
						await this.walkToPoint(nextPoint);
					});
				}
			}
		});
	}

	stopWandering(): void {
		print("stop wandering");
		if (this.wanderConnection) {
			this.wanderConnection.Disconnect();
			this.wanderConnection = undefined;
		}
		this.cancelMovement();
	}

	/**
	 * Check Line of Sight to a target model
	 */
	private hasLOSToTarget(targetModel: Model): boolean {
		if (!this.rootPart || !targetModel.PrimaryPart) return false;

		const myPos = this.rootPart.Position;
		const targetPos = targetModel.PrimaryPart.Position;
		const direction = targetPos.sub(myPos);

		const params = new RaycastParams();
		params.FilterDescendantsInstances = [this.model!];
		params.FilterType = Enum.RaycastFilterType.Exclude;

		const rayResult = Workspace.Raycast(myPos, direction, params);

		// LOS is clear if no hit, or if we hit the target
		return !rayResult || (rayResult.Instance && rayResult.Instance.IsDescendantOf(targetModel));
	}

	stopFollowing(): void {
		print("stop following");
		if (this.followConnection) {
			this.followConnection.Disconnect();
			this.followConnection = undefined;
		}
		this.cancelMovement();
	}
}

async function getPathLength(agent: Model, startPos: Vector3, targetPos: Vector3): Promise<number | undefined> {
	const path = PathfindingService.CreatePath({
		AgentRadius: 2,
		AgentHeight: 5,
		AgentCanJump: true,
	});

	try {
		path.ComputeAsync(startPos, targetPos);
		if (path.Status !== Enum.PathStatus.Success) {
			return undefined; // Unreachable spot
		}

		const waypoints = path.GetWaypoints();
		let totalLength = 0;
		for (let i = 0; i < waypoints.size() - 1; i++) {
			totalLength += waypoints[i].Position.sub(waypoints[i + 1].Position).Magnitude;
		}

		return totalLength;
	} catch (e) {
		return undefined;
	}
}
