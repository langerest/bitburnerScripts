import { NS } from "..";
import { listServers } from "./opened-servers.js"

/** @param {import("../.").NS} ns */
async function scan(ns: NS, parent: string, server: string, list: string[]) 
{
	const children = ns.scan(server);
	if (list.includes(server)) 
	{
		try 
		{
			await ns.singularity.installBackdoor();
			ns.tprint(`Installed backdoor on '${server}'.`);
		} 
		catch (error) 
		{
			ns.print(error);
		}
	}

	for (const child of children) 
	{
		if (parent == child) 
		{
			continue;
		}
		ns.singularity.connect(child);
		await scan(ns, server, child, list);
	}

	if (parent) 
	{
		ns.singularity.connect(parent);
	}
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) {
	const importantServers = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'w0r1d_d43m0n'];
	do 
	{
		var servers = listServers(ns).filter(server => !ns.getServer(server).backdoorInstalled && importantServers.includes(server));
		await scan(ns, "", "home", servers);
		await ns.sleep(10000);
	}
	while (servers.length)
}