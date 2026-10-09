import { ref } from "@rbxts/jecs-utils";
import { Workspace, ReplicatedStorage, RunService, TweenService } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AUDIO_PATH } from "shared/data/ImageIDs";
import { AnimationUtils } from "shared/utils/animationUtil";
import { sayMonologue } from "shared/utils/sayMonologue";

@SkillDecorator
export class Chainsaw extends Skill {
	revCount: number = 0;
	revCooldown = 1;
	temp: number = 25;
	revRequired: number = 3;
	condition: number = 1; //1 good, 2 damaged, 3 dead
	fuel: number = 0; //will be added later, fuel and resource management
	running: boolean = false;

	revAnimPlaying: boolean = false;
	vmRevTrack: AnimationTrack | undefined;
	viewmodel: Model | undefined;
	clientChainsaw: (Model & { handle: BasePart; chains1: MeshPart; chains2: MeshPart }) | undefined;
	serverChainsaw: (Model & { handle: BasePart; chains1: MeshPart; chains2: MeshPart }) | undefined;
	serverRunningSound: Sound | undefined;
	serverRevSound: Sound | undefined;

	chainsawCharTracks = ANIMATION_IDS.item.Teeth as typeof ANIMATION_IDS.item.Teeth;
	chainsawViewmodelTracks = ANIMATION_IDS.viewmodel.Teeth as typeof ANIMATION_IDS.viewmodel.Teeth;

	viewmodelRunningTrack: AnimationTrack | undefined;
	charRunningTrack: AnimationTrack | undefined;
	teethThread: thread | undefined;

	soundTweenInfo = new TweenInfo(1, Enum.EasingStyle.Cubic);

	//idle, default, not revved: 25 degrees C
	//player pulls (F) 3 times
	//player can shut it down using (F) to manage heat and fuel, has to be revved again
	//running for the first 10 seconds(+0.5 deg/sec)
	//running for 10-20 seconds(+3 deg/sec)
	//running for 20+ seconds(+6 deg/sec)
	//cutting enemy (+7/sec)
	// at 180-200 range
	// (if condition is 1) - 3% of stalling per second
	// (if condition is 2 ) - 5% chance of stalling per second
	//auto stalls if reached >220 degrees C, condition immediately decreased to 2
	//shut down decrease rate (first 10 seconds (-3 deg/sec), 10+ seconds (-6 deg/sec))

	//make unable to be switched from while running

	protected OnStartClient(): void {
		const playerEntity = ref.find(this.Player!);

		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;

			this.clientChainsaw = this.viewmodel.FindFirstChild("Teeth") as Model & {
				handle: BasePart;
				chains1: MeshPart;
				chains2: MeshPart;
			};
		}

		AnimationUtils.preloadAnimations(this.viewmodel, [
			this.chainsawViewmodelTracks.idling,
			this.chainsawViewmodelTracks.revving,
			this.chainsawViewmodelTracks.running,
		]);
	}

	protected OnStartServer(): void {
		const playerEntity = ref.find(this.Player!);

		this.serverChainsaw = this.Player!.Character!.FindFirstChild("Teeth") as Model & {
			handle: BasePart;
			chains1: MeshPart;
			chains2: MeshPart;
		};
	}

	rev() {
		//add 1 sec debounce here
		if (this.revAnimPlaying) return;
		if (!this.viewmodel) return;
		this.revCount += 1;
		this.serverRev();
		this.revAnimPlaying = true;

		sayMonologue("it seems i am not the only spy.. hmm.. of course not, i suppose not");
		// print("revcount", this.revCount);

		this.vmRevTrack = AnimationUtils.loadAnim(this.viewmodel, "revving", this.chainsawViewmodelTracks.revving);
		this.vmRevTrack!.Stopped.Connect(() => {
			//dont use .Ended
			this.revAnimPlaying = false;
		});

		if (this.revCount === this.revRequired) {
			task.wait(1.3);
			this.run();
		}
		// this.ApplyCooldown(this.revCooldown); //wcs cant apply cooldown on client apparently, has to be on server damn
	}

	stop() {
		this.revCount = 0;
		this.running = false;
		this.serverStop();
		if (this.viewmodelRunningTrack) {
			this.viewmodelRunningTrack.Stop();
			this.viewmodelRunningTrack = undefined;
		}
	}

	run() {
		if (!this.viewmodel) return;

		print("running", this.revCount);
		this.serverRun();

		this.running = true;
		this.viewmodelRunningTrack = AnimationUtils.loadAnim(
			this.viewmodel,
			"running",
			this.chainsawViewmodelTracks.running,
			0,
			true,
		);
		//theres 2 teeth meshes. one of them is transparent one of them is opaque
		//they switch between being transparent and opaque for the illusion of moving teeth as they are slightly differently placed
		this.teethThread = task.spawn(() => {
			while (this.running) {
				if (!this.clientChainsaw) break;

				this.clientChainsaw.chains1.Transparency = 1;
				this.clientChainsaw.chains2.Transparency = 0;
				// print("1")
				task.wait(0.05);

				if (!this.running) break;

				this.clientChainsaw.chains1.Transparency = 0;
				this.clientChainsaw.chains2.Transparency = 1;
				// print("2")
				task.wait(0.05);
			}
		});
	}

	decreaseCondition() {
		this.condition = 2;
		this.revRequired = 4;
	}

	brokenCondition() {
		this.condition = 3;
		this.revRequired = 40;
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverRun() {
		this.charRunningTrack = AnimationUtils.loadAnim(
			this.Player!.Character!,
			"running",
			this.chainsawCharTracks.running,
			0,
			true,
		);

		if (!this.serverRunningSound) {
			this.serverRunningSound = AUDIO_PATH.items.chainsaw.running.Clone();
			this.serverRunningSound.Parent = this.serverChainsaw?.handle;
			this.serverRunningSound.Play();
		} else {
			this.serverRunningSound.Volume = 0.635;
			this.serverRunningSound.Play();
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverRev() {
		AnimationUtils.loadAnim(this.Player!.Character!, "revving", this.chainsawCharTracks.revving, 0, false);

		if (!this.serverRevSound) {
			this.serverRevSound = AUDIO_PATH.items.chainsaw.rev.Clone();
			this.serverRevSound.Parent = this.serverChainsaw?.handle;
			this.serverRevSound.Play();
		} else {
			this.serverRevSound.Play();
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverStop() {
		this.charRunningTrack?.Stop(0.2);
		this.charRunningTrack = undefined;
		const stopSoundTween = TweenService.Create(this.serverRunningSound!, this.soundTweenInfo, { Volume: 0 });
		stopSoundTween.Play();
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}

	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			// AnimationUtils.clearAllAnimations(this.Character.Player?.Character as Model, 0.2);
		});
	}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
		});
	}
}
