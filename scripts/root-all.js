import 
{
	listServers
} 
from '/scripts/opened-servers.js'

import 
{
	root
} 
from '/scripts/root.js'

/** @param {import("../.").NS} ns */
export async function rootAll(ns)
{
	var servers = listServers(ns).filter(server => !ns.hasRootAccess(server));
	for (const server of servers) 
	{
		root(ns, server);
	}
}

/** @param {import("../.").NS} ns */
export async function main(ns) 
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