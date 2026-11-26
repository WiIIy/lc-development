import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const CombatStateComponents = {
	Stunned: world.entity(), // tag. REPLACES the old Stunned component
	StunTimer: component<StunTimer>(),
	ParryDisabledUntil: component<number>(),
	PlayerAttackReadyAt: component<{ [attack: string]: number }>(),
	PlayerBlockReadyAt: component<number>(),
};
