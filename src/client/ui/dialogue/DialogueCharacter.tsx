/* eslint-disable roblox-ts/lua-truthiness */
import React from "@rbxts/react";
import DialogueResponseButton from "./DialogueResponseButton";
import { ProducerType } from "./DialogueTextHandler";
import { fivePixelPadding } from "../debug/DebugUI";

interface DialogueProps {
	canvasGroupRef: React.RefObject<CanvasGroup>;
	frameRef: React.RefObject<Frame>;
	active: boolean;
	dialogueEndedSignal: boolean;
	speakerName: string;
	currentResponses: DialogueNodeInfo[];
	isTyping: boolean;
	selectedResponseIndex: number | undefined;
	displayedPromptText: string;
	handlePromptClick: () => void;
	producer: unknown;
	font: Enum.Font;
	promptcolor: Color3;
	bgcolor: Color3;
}

export const DialogueCharacter: React.FC<DialogueProps> = ({
	canvasGroupRef,
	active,
	dialogueEndedSignal,
	currentResponses,
	isTyping,
	selectedResponseIndex,
	displayedPromptText,
	handlePromptClick,
	producer,
	frameRef,
	speakerName,
	font,
	promptcolor,
	bgcolor,
}) => (
	<canvasgroup
		key={"MainCanvasGroup"}
		ref={canvasGroupRef}
		Visible={active || dialogueEndedSignal}
		BackgroundTransparency={1}
		GroupTransparency={1}
		BackgroundColor3={new Color3(0, 0, 1)}
		Size={UDim2.fromScale(1, 1)}
		Position={UDim2.fromScale(0.5, 0.5)}
		AnchorPoint={new Vector2(0.5, 0.5)}
		BorderSizePixel={0}
	>
		<frame
			key={"ResponseFrame"}
			BackgroundTransparency={1}
			Size={UDim2.fromScale(0.6)}
			AnchorPoint={new Vector2(0, 0)}
			Position={UDim2.fromScale(0.5, 0.55)}
			Visible={!isTyping && currentResponses.size() > 0}
			AutomaticSize={"Y"}
		>
			<uicorner CornerRadius={new UDim(0.05, 0)} />
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				HorizontalAlignment={Enum.HorizontalAlignment.Left}
				Padding={new UDim(0, 5)}
			/>
			<uipadding
				PaddingBottom={new UDim(0, 5)}
				PaddingTop={new UDim(0, 5)}
				PaddingLeft={new UDim(0, 5)}
				PaddingRight={new UDim(0, 5)}
			/>
			{currentResponses.map((nodeInfo: DialogueNodeInfo, index: number) => (
				<DialogueResponseButton
					key={nodeInfo.instance.GetFullName()}
					text={nodeInfo.text || "Response"}
					onClick={() => (producer as ProducerType).selectResponse(nodeInfo)}
					isSelected={index === selectedResponseIndex}
				/>
			))}
		</frame>
		<textlabel
			key={"Speaker"}
			Text={speakerName !== "" ? "<b>" + speakerName + "</b>" : "?"} //check if speakername empty
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextSize={16}
			TextXAlignment={Enum.TextXAlignment.Left}
			TextYAlignment={Enum.TextYAlignment.Top}
			TextWrapped={true}
			AutomaticSize={"Y"}
			RichText={true}
			Font={font}
			Size={UDim2.fromScale(0.64, 0.09)}
			Position={UDim2.fromScale(0.1, 0.8)}
			AnchorPoint={new Vector2(0, 1)}
			BackgroundTransparency={0}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			TextTransparency={0}
		>
			<uipadding PaddingLeft={fivePixelPadding} PaddingTop={fivePixelPadding} />
		</textlabel>
		<textbutton
			key={"PromptTextButton"}
			Text={displayedPromptText}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextSize={12}
			TextXAlignment={Enum.TextXAlignment.Left}
			TextYAlignment={Enum.TextYAlignment.Top}
			TextWrapped={true}
			AutomaticSize={"Y"}
			RichText={true}
			Font={Enum.Font.Arial}
			Size={UDim2.fromScale(0.64, 0.18)}
			Position={UDim2.fromScale(0.1, 0.93)}
			AnchorPoint={new Vector2(0, 1)}
			BackgroundTransparency={0}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			TextTransparency={0}
			AutoButtonColor={false}
			Event={{
				Activated: handlePromptClick,
			}}
		>
			<uipadding PaddingLeft={fivePixelPadding} PaddingTop={fivePixelPadding} />
		</textbutton>
	</canvasgroup>
);
