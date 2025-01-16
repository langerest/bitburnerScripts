import { NS } from "..";

export async function main(ns: NS) {
	const earlyDaemonScript = "daemon-8gb.js";
	const daemonScript = "daemon.js";
	let resetInfo = ns.getResetInfo();
	if ((resetInfo.ownedSF.get(4) === undefined && resetInfo.currentNode != 4) || 
		(resetInfo.ownedSF.get(5) === undefined && resetInfo.currentNode != 5))
	{
		ns.run(earlyDaemonScript, {temporary: true});
		return;
	}

	ns.run(daemonScript, {temporary: true});
}