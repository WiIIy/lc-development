//TO BE DELETED
// import { GrapplingHook } from "shared/skills/grapplinghook";
//todo separate so not monolith

export const ANIMATION_IDS = {
	npc: {
		//attack animations use ParryStart, ParryEnd, Hit
		idle: {
			alpha: "85647118133147",
			galilei: "109812281316513",
		},
		crane: {
			idle: "",
			run: "",
			slash: "",

			throw: "",
		},
		base: {
			walk: "109095059744506",
			idle: "89419090591391",
			sit: "178130996",
		},
		seat: {
			Armchair: {
				sit1: "131472645374059",
				sit2: "132189222244379",
			},
			DoubleArmchair: {
				sit1: "131472645374059",
				sit2: "132189222244379",
			},
		},
	},
	combatnpc: {
		sab: {
			equipping: "99620410878365", //action
			idling: "93574366659679", //priority idle
			lightattack: "80920711063070", //action2
		},
		alpha: {
			equipping: "124394806587863",
			idling: "119987760195853",
		},
	},
	character: {
		knockedover: "124907938130594", //action4, event:fell
		crouching_legs: "120629369867341", //property set to idle so it overrides core walk anim that makes it a bit taller than intended
		crouching_arms: "103395074527546", //priority set to core so it doesnt override arm and toolanimations
	},
	actions: {
		squared_up: "125336861445915", //idle, looped
		light: "139221136470370", //movement
		block: "125419177069460", //action, looped
		heavy: "112824014974371", //movement
		shove: "74686438374732", //movement
	},
	death: {},
	noitem: {
		viewmodelidle: "106429706607179",
		walk: "73030774121610",
		chatting: "93823709234323", //holding radio
		carried: "89784762210173",
		carrying: "72239641512299",
		vmCarrying: "136762556395072",
		dragged: "139596127828127", //action3
		dragging1: "113843149158801", //action3
		dragging2: "80130115933040", //movement
		vmDragging: "103310207135792", //action4
	},
	item: {
		// ========================== melee/throwable ==========================
		Baseballbat: {
			equipping: "85502682238216", //movement overrides idle
			idling: "77193538526171", //idle overrides core
			lightattack: "101918011042185", //action2 because action does not work for whatever reason. also this a placeholder. its shit
			heavyattack: "",
		},
		Knife: {
			equipping: "",
			idling: "130476372206488",
			throwing: "72461062360762", //events: hold, throw
		},
		Claw: {
			equipping: "124156139487207",
			idling: "72454406789656", //idle
			parrying: "112108321159671",
			heavyattack: "123658153292952",
			lightattack: "88492882111067",
		},
		Kabar: {
			equipping: "87600550679967",
			idling: "86425564901856",
		},
		Rat: {
			equipping: "96325917423108",
			idling: "91553688475800",
			throwing: "104684049189781",
		},
		Lobotomizer: {
			equipping: "",
			idling: "106089785391076",
			lightattack: "107312661489191",
			heavyattack: "107369640556200",
			parrying: "135584057887269",
		},
		Sledgehammer: {
			equipping: "",
			idling: "138266934127739",
			parrying: "101949021239175",
		},
		Jesus: {
			equipping: "",
			idling: "108540214715444",
			parrying: "112775313974722",
		},
		GrapplingHook: {
			equipping: "",
			idling: "",
			grappling: "79817903253920",
			grappleOff: "110575010481220",
		},
		Teeth: {
			equipping: "",
			idling: "82849382307326",
			revving: "82395253186244",
			running: "116608296549075", //action2
			parrying: "118240594005696",
			lightattack: "85886593813584", //action2, can play together with running
		},
		Molotov: {
			idling: "131277060986900",
			equipping: "",
			winding: "108001845616864", //event: hold to mark when to adjustspeed 0
			throwing: "110958793969379",
		},
		Lighter: {
			idling: "118030921873039",
			equipping: "", //not a regular item
			lighting: "102786571527740", //event: light to mark when particles are visible, for left arm
			lighting2: "112276427186165", //action2; events: click, light; for right arm
			idling_on: "119529479779113", //movement overrides default idle
		},

		// ======================= misc ==============
		Jerrycan: {
			idling: "74857733011420",
			equipping: "",
		},
		Flashlight: {
			idling: "122270206645080",
			equipping: "",
		},
		Droneremote: {
			idling: "93705470692410", //idle
			equipping: "",
			focus: "136905160122529", //iirc action2
		},

		// ========================== firearms ==========================
		Vag73: {
			equipping: "",
			idling: "134801842317940",
			aiming: "95037546888846",
			magout: "91274644519614", //action3
			parrying: "88649479682022", //action2
		},
		M10: {
			equipping: "",
			idling: "103568251184335",
			aiming: "101418560980577",
			magout: "110102428211905",
			parrying: "136291379263465",
		},
		R50: {
			idling: "108782193426992",
			equipping: "",
			aiming: "77386792602249",
			magout: "88328866835887",
			parrying: "97800307719343",
			firing: "110206075593683",
		},
		Serpent: {
			idling: "113969988241742",
			equipping: "",
			aiming: "124895254708722",
			magout: "100885338847953",
			parrying: "123821453228035",
		},
		Taurus: {
			idling: "86882163095694",
			equipping: "",
			aiming: "128289960640208",
			parrying: "137677961573463",
			magout: "107511070779495", //action 3, looped
		},
	},
	viewmodel: {
		// ========================== melee/throwable ==========================
		Baseballbat: {
			equipping: "81698442930293", //priority movement
			idling: "132820124793903", //priority idle
			lightattack: "132020807309734", //priority action2, event: hit
			heavyattack: "", //priority action2, event: hit
		},
		Knife: {
			equipping: "83218235922309", //priority movement
			idling: "83218235922309", //also movement
			throwing: "113986608546121", //30frms,movement; events: hold (17), throw (fire projectile, 26)
			lightattack: "71596858944563", //2 events, start (whoosh) and hit (for dmg and hit sound)
			heavyattack: "",
			parrying: "116792193464163", //action
		},
		Rat: {
			equipping: "74817187128854",
			idling: "109340721408967",
			throwing: "126054617470973",
		},
		Fireaxe: {
			equipping: "",
			idling: "",
		},
		Claw: {
			equipping: "126233819437148",
			idling: "74168164532309", //priority idle
			lightattack: "139944911694731", //action2, event: hit
			heavyattack: "118467403637602", //action2, event: hit
			parrying: "128030634094930", //action3, 1 frame, make sure every part has keyframe or itll default to the idle pos
		},
		Kabar: {
			equipping: "134865818937296",
			idling: "72530902467923",
		},
		Lobotomizer: {
			equipping: "",
			idling: "128494729099645",
			lightattack: "111149538175415",
			heavyattack: "98694393955834",
			parrying: "76167884795154",
		},
		Sledgehammer: {
			equipping: "92343733148539",
			idling: "87225252958850",
			parrying: "112169990449421",
		},
		Jesus: {
			equipping: "",
			idling: "80269600145440",
			parrying: "114435170542122",
		},
		GrapplingHook: {
			equipping: "", //no need
			idling: "", //no need
			grappling: "91997769850142", //action 4, event: hold
			grappleOff: "75756115462055",
		},
		Teeth: {
			equipping: "",
			idling: "102772676443287",
			revving: "118151004766277",
			running: "100830583321572", //action3
			parrying: "91224816779789",
			lightattack: "100095140866981", //also action 3, plays with revving if revved
		},

		// ========== misc ==========
		Molotov: {
			idling: "124448920634519",
			equipping: "",
			lighting: "114158681961221",
			winding: "134403309074483",
			throwing: "90802152651792",
		},
		Lighter: {
			idling: "86324023476588",
			equipping: "",
			lighting: "132892267756168", //event: light to mark when particles are visible; this is for the left arm one
			lighting2: "92337141512981", //action2; events: click, light; for right arm
			idling_on: "78396957397925", //movement overrides regular idle
		},
		Jerrycan: {
			equipping: "",
			idling: "135478302895958",
		},
		Flashlight: {
			idling: "98754671705678",
			equipping: "120850630874631",
		},
		Droneremote: {
			idling: "75650129939168",
			equipping: "",
			focus: "95632344960741",
		},

		// ========================== firearms ==========================

		Vag73: {
			equipping: "",
			idling: "83303707944031",
			firing: "114727245216951",
			magout: "111919599280655",
			parrying: "133907601584683",
		},
		M10: {
			equipping: "136079577014279",
			idling: "111124873632570", //movement?
			walking: "103242773920810", //movement
			firing: "73340437135919", //movement
			magout: "109668416938963", //action3
			parrying: "78982334560191", //action2
		},
		R50: {
			equipping: "131376252711225",
			idling: "103667307665678",
			magout: "121489354574212",
			parrying: "116616850872966",
			aiming: "81259179709708", //specific to r50 viewmodel, everything else has procedural aiming but r50 has a scope
			firing: "93313842799182",
		},
		Serpent: {
			equipping: "",
			idling: "83548122437668",
			magout: "129421926948951",
			parrying: "131335581974434",
		},
		Taurus: {
			equipping: "",
			idling: "91202868121583",
			parrying: "124154899235662",
			magout: "89628073078710",
		},
	},
};

//another note that the camerapart is in fact animateable

//note make everything belong to blth

//priority guide:
// no-weapon idle/walk            -> core, breathing, ig
// idle with weapon               -> idle
// weapon walk/run equipping      -> movement
//

//every animation event has to be synced between viewmodel/character

// OK SO. GUNS. HOW FUN.
// 1. Idle animation for each, plays while walking too. Equip is optional
// 2. Run animation for each, plays while sprinting
// 3. Shooting animation.
// 4. Taking mag off, I cannot be bothered to animate it in blender. Reload offcam
// 5. Make sure everything has aimparts

// viewmodel
// 1. equipping (mandatory, priority:movement)
// 2. idling (mandatory, priority:idle)
// 3.

//character
// 1. equipping (mandatory, priority:movement)
// 2. idling (mandatory, priority:idle)
// 3. aiming if gun (no aiming anim for vm its procedural, also priority ACTION2 cause it fucking breaks otherwise cause roblox anims default to fucking Action for some reaosn)
// 4. firing (player firing the gun, after 4 secs of not firing they go back to idling )
