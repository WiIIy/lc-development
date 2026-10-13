import { Service, OnStart } from "@flamework/core";

@Service({})
export class TestService implements OnStart {
	constructor() {}

	onStart(): void {
		print("heh");
	}
}
