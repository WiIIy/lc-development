import { Flamework } from "@flamework/core";
import { setupLogger } from "shared/utils/setup/setup-logger";

setupLogger();
Flamework.addPaths("src/server/components");
Flamework.addPaths("src/server/services");
Flamework.addPaths("src/server/systems");
Flamework.addPaths("src/shared/components");
Flamework.addPaths("src/shared/systems");

Flamework.ignite();
