import { serializeColor3 } from "shared/utils/profile/colorSerdes";

export const defaultDossierData: DossierData[] = [
	{
		creatorUserId: 1, //default dossier
		currentPage:"1",
		pages: {
			"1": {
				label: '\n                                                                 <b>CONFIDENTIAL</b> \n                                                                          \n\n_______________________________________<b><font size="12"> DD-006</font></b>\n\n<b>Name :</b> Jonathan King\n<b>Status:</b> <r>CLASSIFIED</r>\n<b>DOB   :</b> <r>XX</r>-<r>XX</r>-2013  \n<b>Languages Spoken:</b>   \n - Indonesian (Ongoing teaching \nexperience, refer to footnotes)  \n - English<<break>> <<loadout>>  <<break>> <<skills>>',
				images: [
					{
						id: "aic",
						assetId: "98292970916878",
						position: { x: 0.01, y: 0.005 },
						size: { x: 0.3, y: 0.15 },
						zIndex: 1,
						aspectratio: 3 / 2,
					},
					{
						id: "john",
						assetId: "83845462146492",
						position: { x: 0.73, y: 0.15 },
						size: { x: 0.3, y: 0.13 },
						zIndex: 2,
						aspectratio: 1,
					},
				],
			},
			"2": {
				label: "<b> Psychological Notes</b>\n John King is to be considered with a highly skeptical lens. His psychiatric development, if not at the very least extremely stunted yet simultaneously overzealously mature, is highly odd and seemingly supernatural. Besides this fact, John suffers from Type II Antisocial Personality Disorder. His remarkably sociopathic attitude makes him highly distrusting of his environment, often flying into fits of isolative contemplative internal rage at a perceived lack of control. Through this lack of control, he wishes to exert his admittedly large but unannounced ego onto the environment through a mastery of a variety of martial arts skills and combative means, his motivation for his skilful use of neck snapping, choking, throwing and otherwise combat techniques is inherently a persistent undoubtedly unfixable psychological flaw, though an individual close to him comes to mind to consistently mend his issues. His perceived lack of control of his environment draws him away from general society and to begin resenting his peers and associates, going so far as to disregard their life value just to be left alone. Though, his lack of control makes him highly materialistic in a push to control his environment even further, hence, it is recommended to keep Jonathan as an asset through increased financial compensation. He feels an increased resentment towards many individuals regardless of identity or relatability, and has an unending recklessness.",
				images: [],
			},
		},
		avatar: {
			shirt: "204560686",
			pants: "1485522424",
			accessories: [5163631069, 89730005123720],
			nickname: "John",
			gender: "male",
			highlight: serializeColor3(new Color3(0.54, 0.02, 0.02)),
			skin: serializeColor3(new Color3(0.81, 0.7, 0.62)),
		},
		build: {
			id: "DD-006",
			buildName: "En Hakkim",
			loadout: ["Vag73", "Katana"],
			skills: ["Dark Triad II", "Agile", "Darkly Dreaming"],
		},
	},
];
