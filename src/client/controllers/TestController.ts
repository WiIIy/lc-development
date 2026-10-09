import { Controller, OnStart } from "@flamework/core";

@Controller({})
export class TestController implements OnStart {
	constructor() {}

	onStart(): void {
		print("heh");
	}
}
