VIBE BIBLE

Project specs:
Roblox-typescript, gets compiled to lua
Synced to Roblox Studio using Rojo
Jecs ECS
Planck Scheduler
Jabby Debugger
Flamework Singletons

Avoid:
No conflicting variable names with the roblox-ts compiler (end, error, next, local)
No usage of type any (instead use "as unknown as Type" type projections, typeOf(), typeIs(), or a declarations ts file for global types)

Principles/Design:
- Modular behavior. one component out, entire behavior goes away
- Each system has one purpose and also helpful error messages so things don't fail silently.
- WCS Skill classes for handling player  (in charge of both client and server behavior)
- A player who is attacking is marked by an Attacking component. This Attacking component gets removed once the animation is over
- NPC behavior handled purely by ECS
- MoveCallbacks have to be universal (move "heavy" can be used on multiple weapons, will call the same callback while passing different values, and should function as normal)
- NPCs and players use the same CurrentlyEquipped component
- d.ts global type files do not need "exports", no imports are allowed either except for a specific type import such as ```typeof import("../../data/npcs/enemyTypes").ENEMY_TYPES[number]; ```

NPC Attacks:
Npcs can perform a few types of moves
1. weaponMove (defined inside weaponsData). This is a normal move. Upon being called, plays an animation, and a callback performs the move's intended functions.
2. Parry (special, all npcs are capable no matter the weapon BUT the npc will behave according to setting)
For example i can have a fistParrying weapon and a fistNonParrying weapon that are set as CurrentlyEquipped on two npcs to have one npc who parries and one non parrying, as you can see, the behavior is easily edited through the weaponsData constant, unlike a weapon move, doesnt depend on an animation callback. Has one default animation, custom per-weapon animations are optional.

Parrying is unlike shove and weaponMove that is triggered by an animation and an event marker, parrying has a custom length that is randomized from, and its duration can be capped and customized. The default parrying animation is a single keyframe that the player fades in and out of. This is unique, and therefore cannot be put in weaponMoves. The code determines the parry length, not the pre-made animation like everything else. 

An npc can parry maximum twice in a row if enabled to prevent stalling.
There will also be a parry timeout in place to prevent the npc from choosing to parry to frequently.

- parry isnt a normal move with a callback
- parry is a single keyframe animation whose unlike other types of attacks, its length must be manually set or randomized
- on non reactive npcs, id like parry to be chosen as if it was a move inside the moves field like light, heavy, special.
- likely run a callback whenever parry is called to randomize parry length instead of playing an animation like other move Callbacks.

Upon an enemy parrying you, your attack does not come through, there is no stun punishment.
Upon parrying an enemy attack, they get a temporary stun defined in the weaponsdata variable

3. Shove (special,  all npcs are capable no matter the weapon BUT the npc will behave according to setting)
For example i can have a fistShoving weapon and a fistNonShoving weapon that are set as CurrentlyEquipped on two npcs to have one npc who parries and one non parrying, as you can see, the behavior is easily edited through the weaponsData constant, unlike a weapon move, doesnt depend on an animation callback. Has one default animation, custom per-weapon animations are optional.

Shove is honetly not that different from a move. It's just a move that disables your parry for a set amount of time because I hate when I get grappled in games and I can't do anything but watch my character flail.

Upon an enemy shoving you, your parry will be broken and disabled for a set amount of time depending on the weapon, if value not available, go to defauilt.
Upon shoving an enemy, they will get stunned. This value can be different from a parry stun.

4. Idle (the state that lacks any move, reactive npcs only, and technically non-reactive npcs in-between moves)

- moves are fixed and defined in the weaponsData constant. This will be the root of NPC behavior
- NPC behavior relies completely on the weaponsData (pair(CurrentlyHeld, Wildcard))
- NPCs will always have an item that is currentlyequipped, if they are visually hidden there will later be implemented be a component for this, called Holstered.
- NPC moves must be easily added and easy to expand. A typical move usually plays an animation and plays a callback when certain markers are hit (e.g. when marker "hit" is reached, call the registerMeleeHit callback, this function triggers a blockcast and calculates if it misses or takes damage)

==================================
There are two main types of attack behaviors. Reactive and Non-Reactive.
Every NPC has a reactive and non-reactive version. But once they are spawned they will be either one. They are simply capable of being two.
NPC's ability to parry and shove is determined by the weaponsData constant.

The main issue to tackle with the two behaviors is how to juggle the multi stateness of everything. 

On non-reactive, Moves are on the same level as parries and shoves and are randomized
On reactive, there will be no combos, every move is decided and executed equally. The npc has certain responses to target player behaviors, e.g. parrying when the target is relatively advancing at them, backtracking, etc. This will be set on the weaponsData constant. ex:

//[targetMovement, targetAction] : [selfMovement, selfAction]

//a backtracking parrying npc ["advancing", "any"] : ["backtracking", "parrying"]
//a backtracking shooting npc ["advancing", "any"] : []
//an aggressive npc {["advancing", "any"]: ["advancing", ["heavy", "light"]], ["backtracking", "any": "advancing", ["heavy", "light"]]}

//these actions might have a weight value. So by default, the npc behavior is chosen randomly from a set of prewritten default values for all npcs that exist. Only on the weaponsData constant is the behavior modified. Max weight is 10, for example [advancing,any]: [backtracking, parry] makes it so the enemy parries whenever they are capable and there is no parry timeout

1. Non reactive (triggered by the Reactive component)
- the ecs attack system chooses a combo, execution system makes npc perform an attack (play an animation), the animation "hit" event marker will do the block cast, hitreg, etc.


2. Reactive (When NPC lacks Reactive component)
- Unlike non-reactive, No action queues for reactive behavior, once decided, immediately executed.
- The Reactive tag overrides default behaviors and gives npc reactive behaviors over the default. Non-reactive is the default and doesn't need to be specified. this behavior stops when the tag gets taken out.
- movement: Still and action: Idle is the default and fallback state.
- Movement states (relative to where npc is facing):
	| "still"
	| "advance"
	| "backtrack"
	| "straferight"
	| "strafeleft"
	| "advanceright"
	| "advanceleft"
	| "backtrackright"
	| "backtrackleft";
- Action states: 
   base: "idle" | "parry" | "shove" (available for absolutely all items and npcs)
   the weapons move values get appended to this state,
  "light" | "heavy" | "throwknife" | "special" (etc) 


3. Tracked target states
Within the Enemy entity, the current target's Transform(cframe) and Behavior(movement and action) are tracked.
They are stored in TargetTransform and TrackTargetRelativeState (this shows whether the player is advancing to the npc or backtracking)



====================

Jecs Syntax
Tags and Components are synonymous
Tags usually have no value and are used to mark entities
Components can have a value

create Entity
```const entity = world.entity```

relationship between two entities
```world.set(pair(CurrentlyEquipped, Knife))```
```world.set(pair(Wearing, Shirt))```

check if entity has a relationsip
```world.has(npcEntity, pair(CurrentlyEquipped, Knife))```

check if entity has a tag
```world.has(npcEntity, CanFly)```

set component value
```world.set(npcEntity, Name, "Robert")```
```world.set(npcEntity, pair(CurrentlyEquipped, Knife), "Knife")```

get component value if available
```world.get(npcEntity, Name) //prints Robert ```
```world.get(npcEntity, Name) //prints Knife```

get child entity
```world.target(npcEntity, CurrentlyEquipped) //returns Knife entity```

get parent entity
```world.get(npcEntity, ChildOf) //returns Knife, ChildOf is a built in component imported from the jecs module```

setting hooks
```world.set(PrintOnAdd, OnAdd, (e)=>{print("hello, I was added to  entity, ", e)})```
```world.set(PrintOnRemove, OnRemove, (e)=>{print("goodbye, I was removed to  entity,", e)})```
