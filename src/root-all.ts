import { NS } from '..';
import { listServers } from './opened-servers.js'
import { root } from './root.js'

/** @param {import("../.").NS} ns */
export async function rootAll(ns: NS)
{
	var servers = listServers(ns).filter(server => !ns.hasRootAccess(server));
	for (const server of servers) 
	{
		root(ns, server);
	}
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
	var servers = listServers(ns);
	while (servers.length) 
	{
		servers = servers.filter(server => !ns.hasRootAccess(server));
		for (const server of servers) 
		{
			root(ns, server);
		}

		if (servers.length) {
			await ns.sleep(10000);
		}
	}
}