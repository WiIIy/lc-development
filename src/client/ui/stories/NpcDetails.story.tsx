import React from "@rbxts/react";
import world from "shared/world";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { NpcDetail } from "client/ui/antler/NpcDetails";
import { GameRouter } from "../GameRouter";

const dummy: NpcData = {
	entity: "100",
	npcType: "Civilian",
	outfit: "Office",
	ai: "lol",
	tags: [],
	state: "idle",
	dialogue: "Dialogue1",

	visibleInteractableEntities: [],
	alertness: 10,
	alertnessMultiplier: 1,
	morale: 0,
	moraleMultiplier: 1,
	hearingRange: 40,

	perks: [],
	statusEffects: [],
	systemsAtWork: ["System1", "System2", "System3"],
	displayPathfinding: false,
	highlighted: true,
	hostile: true,
};

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<NpcDetail
			// entity={dummy.entity}
			// npcType={dummy.npcType}
			// outfit={dummy.outfit}
			// ai={dummy.ai}
			// dialogue={dummy.dialogue}
			// tags={dummy.tags}
			// state={dummy.state}
			// visibleInteractableEntities={dummy.visibleInteractableEntities}
			// alertness={dummy.alertness}
			// alertnessMultiplier={dummy.alertnessMultiplier}
			// morale={dummy.morale}
			// moraleMultiplier={dummy.moraleMultiplier}
			// hearingRange={dummy.hearingRange}
			// perks={dummy.perks}
			// statusEffects={dummy.statusEffects}
			// systemsAtWork={dummy.systemsAtWork}
			// displayPathfinding={dummy.displayPathfinding}
			// highlighted={dummy.highlighted}
			// hostile={dummy.hostile}
			/>
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
