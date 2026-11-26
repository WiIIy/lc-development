import { Entity } from "@rbxts/jecs";
import { CharacterRigR6 } from "@rbxts/promise-character";
import { Character } from "@rbxts/wcs";
import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const PlayerComponents = {
    Health: component<{ current: number; max: number }>(),
    Stamina: component<{ current: number; max: number }>(),
    Blood: component<{ current: number; max: number }>(),
    ActiveStatusEffects: component<StatusEffect[]>(),

    Player: component<Player>(),
    PlayerString: component<string>(),
    JustJoined: world.entity(),
    Character: component<CharacterRigR6>(),
    Inventory: component<Entity[]>(),
    Animator: component<Animator>(),
    WCSCharacter: component<Character>(),
    Humanoid: component<Humanoid>(),
    CurrentlyEquipped: component<string>(),

    IsMelee: world.entity(),
    ItemModel: component<BaseItem>(),
    AnimationQueue: component<string[]>(),
    AnimationLayers: component<Record<string, string>>(),

    PlayerBehavior: component<PlayerBehaviorState>(),
    IsReloading: component<boolean>(),
};