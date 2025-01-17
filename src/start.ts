import { NS } from "..";

export async function main(ns: NS) {
	const earlyDaemonScript = "daemon-8gb.js";
	const daemonScript = "daemon.js";
	let resetInfo = ns.getResetInfo();
	if (((resetInfo.ownedSF.get(4) === undefined || resetInfo.ownedSF.get(4) as number < 3) && resetInfo.currentNode != 4) || 
		(resetInfo.ownedSF.get(5) === undefined && resetInfo.currentNode != 5))
	{
		ns.run(earlyDaemonScript, {temporary: true});
		return;
	}

	ns.run(daemonScript, {temporary: true, ramOverride: 17.8});
}