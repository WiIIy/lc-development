import { InstanceProps } from "@rbxts/react";

export const UICONSTS = {
	fontSize: {
		small: Enum.FontSize.Size12,
		medium: Enum.FontSize.Size14,
		large: Enum.FontSize.Size18,
		xLarge: Enum.FontSize.Size24,
		xxLarge: Enum.FontSize.Size28,
		xxxLarge: Enum.FontSize.Size36,
	},
	font: {
		arialbold: Enum.Font.ArialBold,
		test: Font.fromId(11702779240), //cant use custom :/
	},
	color: {
		black: new Color3(0, 0, 0),
		darkgray: new Color3(0.07, 0.07, 0.07),
		gray: new Color3(0.37, 0.37, 0.37),
		white: new Color3(1, 1, 1),
		red: new Color3(1, 0, 0),

		custom_color_dark: new Color3(0, 0, 0),
		custom_color_mid_dark: new Color3(0.25, 0.25, 0.25),
		custom_color_mid: new Color3(0.5, 0.5, 0.5),
		custom_color_mid_light: new Color3(0.75, 0.75, 0.75),
		custom_color_light: new Color3(1, 1, 1),

		antler_light: Color3.fromHex("eea361"),
		antler_dark: Color3.fromHex("a1472d"),
	},
};

export const currentTheme = "dark";

type StyleList<T extends Instance> = Record<string, InstanceProps<T>>;

export namespace UiStyle {
	//-- consts --//

	export const colors = {
		black: Color3.fromRGB(0, 0, 0),
		white: Color3.fromRGB(255, 255, 255),
	};

	export const frameStyles: StyleList<Frame> = {
		black: {
			BackgroundColor3: UiStyle.colors.black,
		},
	} as const;

	export const colorThemes = {
		light: {
			text_dark: colors.black,
			text_light: colors.white,
			background: colors.white,
			accent: Color3.fromRGB(0, 120, 212),
		},
		dark: {
			text: colors.white,
			background: colors.black,
			accent: Color3.fromRGB(135, 206, 250),
		},
	} as const;

	export const textLabelStyles: StyleList<TextLabel> = {
		textDark: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xxLarge,
			TextColor3: colorThemes.dark.text,
		},
		textLight: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xxLarge,
			TextColor3: colorThemes.light.text_light,
		},
		textAccentDark: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xxLarge,
			TextColor3: colorThemes.dark.accent,
		},
	} as const;

	export const textButtonStyles: StyleList<TextButton> = {
		textDark: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xLarge,
			TextColor3: colorThemes.dark.text,
		},
		textLight: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xxLarge,
			TextColor3: colorThemes.light.text_light,
		},
		textAccentDark: {
			Font: UICONSTS.font.arialbold,
			FontSize: UICONSTS.fontSize.xxLarge,
			TextColor3: colorThemes.dark.accent,
		},
	} as const;

	export const imageLabelStyles: StyleList<ImageLabel> = {
		black: {
			ImageColor3: UiStyle.colors.black,
		},
		white: {
			ImageColor3: UiStyle.colors.white,
		},
	} as const;
}

//-- functions --//
export function styleFrame(style?: keyof typeof UiStyle.frameStyles): InstanceProps<Frame> {
	return {
		...(style !== undefined && UiStyle.frameStyles[style]),
		BorderSizePixel: 0,
	};
}

export function styleTextLabel(style: keyof typeof UiStyle.textLabelStyles): InstanceProps<TextLabel> {
	return {
		...UiStyle.textLabelStyles[style],
		AutomaticSize: "XY",
		BorderSizePixel: 0,
		BackgroundTransparency: 1,
	};
}

export function styleImageLabel(style: keyof typeof UiStyle.imageLabelStyles): InstanceProps<ImageLabel> {
	return {
		...UiStyle.imageLabelStyles[style],
		AutomaticSize: "XY",
		BorderSizePixel: 0,
		BackgroundTransparency: 1,
	};
}
export function styleTextButton(style: keyof typeof UiStyle.textButtonStyles): InstanceProps<TextButton> {
	return {
		...UiStyle.textButtonStyles[style],
		AutomaticSize: "XY",
		BorderSizePixel: 0,
		BackgroundTransparency: 1,
	};
}
