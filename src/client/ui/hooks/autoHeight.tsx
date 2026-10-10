// client/ui/components/hooks/useTextLabelAutoHeight.tsx
import React, { useCallback, useEffect } from "@rbxts/react";

/**
 * A React hook that automatically adjusts the height of a TextLabel
 * based on its text content and TextWrapped property.
 *
 * @param textLabelRef A React ref to the TextLabel instance.
 * @param text The text content that the TextLabel displays.
 * @param padding Optional padding to add to the calculated height.
 */
export function useTextLabelAutoHeight(textLabelRef: React.RefObject<TextLabel>, text: string, padding: number = 0) {
	const resizeTextLabel = useCallback(() => {
		const textLabel = textLabelRef.current;
		if (!textLabel) {
			return;
		}

		const originalAutomaticSizeY =
			textLabel.AutomaticSize === Enum.AutomaticSize.Y || textLabel.AutomaticSize === Enum.AutomaticSize.XY;
		if (originalAutomaticSizeY) {
			textLabel.AutomaticSize = Enum.AutomaticSize.None;
		}

		const originalSize = textLabel.Size;

		textLabel.Size = new UDim2(originalSize.X.Scale, originalSize.X.Offset, 0, 100000);

		const newHeight = textLabel.TextBounds.Y + padding;

		textLabel.Size = new UDim2(originalSize.X.Scale, originalSize.X.Offset, 0, newHeight);

		// Restore original AutomaticSize if it was enabled
		if (originalAutomaticSizeY) {
			textLabel.AutomaticSize = Enum.AutomaticSize.XY; // Or Y, depending on initial state
		}
	}, [textLabelRef, padding]);

	useEffect(() => {
		const textLabel = textLabelRef.current;

		if (textLabel) {
			// Initial resize
			resizeTextLabel();

			// Listen for changes to TextBounds (e.g., if text changes or font properties change)
			const connection = textLabel.GetPropertyChangedSignal("TextBounds").Connect(() => {
				resizeTextLabel();
			});

			// Clean up the connection when the component unmounts or dependencies change
			return () => {
				connection.Disconnect();
			};
		}
	}, [text, textLabelRef, resizeTextLabel]); // Re-run effect if text or ref changes
}
