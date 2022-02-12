import {
	list_servers
} from '/scripts/opened-servers.js'
import {
	root
} from '/scripts/root.js'

/** @param {import("../.").NS} ns */
export async function main(ns) {
	var servers = list_servers(ns);
	while (servers.length) {
		servers = servers.filter(server => !ns.hasRootAccess(server));
		//ns.tprint(servers);
		for (const server of servers) {
			root(ns, server);
		}
		if (servers.length) {
			await ns.sleep(10000);
		}
	}
}