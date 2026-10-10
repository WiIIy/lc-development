import { Element, useState } from "@rbxts/react";
import React from "@rbxts/react";
import { Label } from "./BindsList";
import { UserInputService } from "@rbxts/services";

// eslint-disable-next-line prettier/prettier
const every_command_ever: string[] = [
	"/give [item] - gives an item",
    "/spawn [item] - spawns an item"
]

export function CmdList(): Element {
	const [cmdListVisible, setCmdListVisible] = useState<boolean>(false);

	const conn = UserInputService.InputBegan.Connect((inp, proc) => {
		if (proc) return;
		if (inp.KeyCode === Enum.KeyCode.C) {
			setCmdListVisible(!cmdListVisible);
			conn.Disconnect();
		}
	});
	return (
		<frame
			Visible={cmdListVisible}
			BackgroundTransparency={0.1}
			Position={UDim2.fromScale(0.2)}
			Size={UDim2.fromScale(0.2, 0)}
			BackgroundColor3={new Color3(1, 1, 1)}
			AutomaticSize={"Y"}
		>
			<uilistlayout HorizontalAlignment={"Center"} />
			{every_command_ever.map((bind) => (
				<Label text={bind} />
			))}
		</frame>
	);
}
