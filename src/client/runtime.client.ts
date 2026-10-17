import { Flamework } from "@flamework/core";
import { setupLogger } from "shared/utils/setup/setup-logger";

setupLogger();
Flamework.addPaths("src/client/components");
Flamework.addPaths("src/client/controllers");
Flamework.addPaths("src/client/systems");

Flamework.addPaths("src/shared");

Flamework.ignite();
