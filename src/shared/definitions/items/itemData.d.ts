type ItemData = {
	slot: string;
	slotType: SlotType;
	name: string;
	icon: string;
	stackable?: string;
	currentAmmo?: number;
	maxAmmo?: number;
	currentFuel?: number;
	maxFuel?: number;
	overheated?: boolean;
	amount?: number;
	droneDeployed?: boolean;
	droneSpeed?: number;
};
