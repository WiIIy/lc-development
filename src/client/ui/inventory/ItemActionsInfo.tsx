import React, { Element, useEffect, useState, useRef } from "@rbxts/react";
import { RunService, HttpService, Players } from "@rbxts/services";
import { useAtom } from "@rbxts/react-charm";
import { pointedInstance, pointedItem } from "client/clientAtoms";
import world from "shared/world";
import { pair, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import { HIGHLIGHTABLE_ITEMS } from "shared/data/items/highlightable";
import { Action } from "shared/data/profile/defaultKeybinds";
import { isAiming, isDroneFocusing, droneDeployed, isHoldingThrow } from "shared/sharedAtoms";
import { getDisplayStringForAction } from "shared/utils/input/getDisplayStringFromAction";
import { getCurrentWCS_Character } from "shared/data/status/getCurrentWcsCharacter";
import { getItemActions } from "shared/utils/input/getItemActions";
import { ref } from "@willy/jecs-utils";

interface ActionDisplayData {
	key: string;
	name: string;
}

export function ItemActionsInfo(): Element {
	const [actions, setActions] = useState<ActionDisplayData[]>([]);
	const pointedItemString = useAtom(pointedItem);

	// Context States
	const aimingState = useAtom(isAiming);
	const droneFocusState = useAtom(isDroneFocusing);
	const droneDeployedState = useAtom(droneDeployed);
	const throwModeState = useAtom(isHoldingThrow);

	const lastStateJson = useRef<string>("");

	useEffect(() => {
		const connection = RunService.Heartbeat.Connect(() => {
			const newActions: ActionDisplayData[] = [];
			const interactKeyString = getDisplayStringForAction(Action.EnvironmentInteract); // "E"

			const localPlayer = Players.LocalPlayer;
			const char = localPlayer.Character;

			if (!char) {
				print("somethings seriously wrong with item actions info");
				return;
			}

			const humanoid = char.FindFirstChild("Humanoid") as Humanoid;

			if (char.PrimaryPart && pointedInstance()) {
				const targetInstance = pointedInstance()!;

				let pos: Vector3;
				if (targetInstance.IsA("BasePart")) {
					pos = (targetInstance as BasePart).Position;
				} else if (targetInstance.IsA("Model")) {
					pos = (targetInstance as Model).GetPivot().Position;
				} else {
					pos = new Vector3(0, 0, 0);
				}
				const distance = char.PrimaryPart.Position.sub(pos).Magnitude;

				// Only inject UI elements if within structural interaction range
				if (distance !== undefined && distance <= 8) {
					if (pointedItemString === "OpenHitbox") {
						newActions.push({
							key: getDisplayStringForAction(Action.EnvironmentInteract),
							name: "Push",
						});
						newActions.push({
							key: getDisplayStringForAction(Action.DoorPull),
							name: "Pull",
						});
					} else if (pointedItemString === "OpenSlightHitbox") {
						newActions.push({
							key: getDisplayStringForAction(Action.EnvironmentInteract),
							name: "Push Slightly",
						});
						newActions.push({ key: getDisplayStringForAction(Action.DoorPull), name: "Pull Slightly" });
					} else if (
						pointedItemString !== "" &&
						pointedItemString !== undefined &&
						HIGHLIGHTABLE_ITEMS.includes(pointedItemString)
					) {
						newActions.push({ key: interactKeyString, name: "Interact" });
					} else if (pointedInstance()?.IsA("Seat")) {
						newActions.push({ key: getDisplayStringForAction(Action.SitUnsit), name: "Sit" });
					}
				}
			}

			if (humanoid && humanoid.Sit) {
				newActions.push({
					key: getDisplayStringForAction(Action.SitUnsit),
					name: "Unsit", // or "Stand"
				});
			}

			const playerEntity = ref.find(Players.LocalPlayer);
			const wcsChar = getCurrentWCS_Character();
			if (playerEntity === undefined || !wcsChar) return;
			const heldItem = world.get(playerEntity, pair(Components.CurrentlyEquipped, Wildcard));

			// 2. Item Specific Actions based on Categories
			if (heldItem !== undefined) {
				const context: ActionStateContext = {
					isAiming: aimingState,
					isDroneFocused: droneFocusState,
					isDroneDeployed: droneDeployedState,
					isThrowMode: throwModeState,
				};

				// Fetch the pre-combined list of base + specific actions
				const activeItemActions = getItemActions(heldItem as string);

				for (const actionDef of activeItemActions) {
					if (actionDef.condition && !actionDef.condition(context)) {
						continue;
					}

					let displayKey = "";
					if (actionDef.trigger.type === "Raw") {
						displayKey = actionDef.trigger.key;
					} else if (actionDef.trigger.type === "Action") {
						displayKey = getDisplayStringForAction(actionDef.trigger.action);
					}

					newActions.push({ key: displayKey, name: actionDef.description });
				}
			}

			const currentJson = HttpService.JSONEncode(newActions);
			if (currentJson !== lastStateJson.current) {
				lastStateJson.current = currentJson;
				setActions(newActions);
			}
		});

		return () => connection.Disconnect();
	}, [pointedItemString, aimingState, droneFocusState, droneDeployedState, throwModeState]);

	return (
		<frame
			Size={UDim2.fromScale(0.15, 0.2)}
			Position={UDim2.fromScale(1, 0.95)}
			AnchorPoint={new Vector2(1, 1)}
			BackgroundTransparency={1}
			key={"ItemActionsInfo"}
		>
			<uilistlayout
				FillDirection={"Vertical"}
				Padding={new UDim(0, 3)}
				VerticalAlignment={"Center"}
				HorizontalFlex={"SpaceEvenly"}
			/>
			{actions.map((act, index) => (
				<ItemAction key={index} actionKey={act.key} action={act.name} />
			))}
		</frame>
	);
}

export function ItemAction(props: { actionKey: string; action: string }): Element {
	return (
		<frame Size={UDim2.fromScale(0.9, 0.15)} BackgroundTransparency={1}>
			<uilistlayout FillDirection={"Horizontal"} VerticalAlignment={"Center"} />
			<textlabel
				Text={`[ ${props.actionKey} ]`}
				Size={UDim2.fromScale(0.3, 1)}
				TextSize={9}
				BackgroundTransparency={1}
				TextColor3={new Color3(0, 0, 0)}
			/>
			<textlabel
				Text={props.action}
				Size={UDim2.fromScale(0.7, 1)}
				TextSize={9}
				BackgroundTransparency={1}
				TextColor3={new Color3(0, 0, 0)}
			/>
		</frame>
	);
}
