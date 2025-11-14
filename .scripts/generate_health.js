const service = require("../package.json");
const fs = require("node:fs");

fs.writeFileSync(
	"health",
	JSON.stringify({
		...service,
		env: "production",
		message: "all systems go",
		status: 200,
		timestamp: Date.now(),
	}),
);
