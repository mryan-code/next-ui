/* eslint-env node */
const { execFileSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run");

function getProcessTable() {
	try {
		return execFileSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8" });
	} catch (error) {
		console.error("Unable to list running processes.");
		process.exit(1);
	}
}

function parseProcessTable() {
	return getProcessTable()
		.split("\n")
		.map((row) => row.trim())
		.filter(Boolean)
		.map((row) => {
			const match = row.match(/^(\d+)\s+(\d+)\s+(.*)$/);

			if (!match) {
				return null;
			}

			return {
				pid: Number(match[1]),
				ppid: Number(match[2]),
				command: match[3],
			};
		})
		.filter(Boolean);
}

function getDescendantPids(rootPid, processTable) {
	const descendants = new Set([rootPid]);
	let changed = true;

	while (changed) {
		changed = false;

		for (const processInfo of processTable) {
			if (descendants.has(processInfo.pid)) {
				continue;
			}

			if (descendants.has(processInfo.ppid)) {
				descendants.add(processInfo.pid);
				changed = true;
			}
		}
	}

	return Array.from(descendants);
}

const processTable = parseProcessTable();
// Match Next.js dev/prod servers (replaces former vue-cli-service serve matcher).
const matchingProcesses = processTable.filter((processInfo) => {
	const cmd = processInfo.command;
	const inProject = cmd.includes(projectRoot);
	const isNext =
		(cmd.includes("next") && (cmd.includes("dev") || cmd.includes("start"))) ||
		cmd.includes("node_modules/next/dist");
	return inProject && isNext && !cmd.includes("scripts/Stop.js");
});

if (matchingProcesses.length === 0) {
	console.log("No storm-zero-ui dev server process found.");
	process.exit(0);
}

for (const processInfo of matchingProcesses) {
	const targetPids = getDescendantPids(processInfo.pid, processTable);

	if (isDryRun) {
		console.log(`Would stop PID(s) ${targetPids.join(", ")}: ${processInfo.command}`);
		continue;
	}

	try {
		// High-risk operation: this intentionally terminates the local Next.js server process tree for this project.
		for (const pid of targetPids) {
			try {
				process.kill(pid, "SIGTERM");
			} catch (error) {
				if (!error || error.code !== "ESRCH") {
					throw error;
				}
			}
		}

		console.log(`Stopped PID(s) ${targetPids.join(", ")}: ${processInfo.command}`);
	} catch (error) {
		console.error(`Unable to stop PID ${processInfo.pid}.`);
		process.exitCode = 1;
	}
}
