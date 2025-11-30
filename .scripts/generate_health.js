import { writeFileSync } from "node:fs";
import service from "../package.json" with { type: "json" };

writeFileSync(
	"health",
	JSON.stringify({
		...service,
		env: "production",
		message: "all systems go",
		status: 200,
		timestamp: Date.now(),
	}),
);
