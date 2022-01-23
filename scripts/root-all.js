import { list_servers } from '/scripts/opened-servers.js'
import { root } from '/scripts/root.js'

/** @param {NS} ns **/
export async function main(ns) {
	var servers = list_servers(ns);
	do {
		servers = servers.filter(server => !ns.hasRootAccess(server));
		for (const server of servers) {
			root(ns, server);
		}
		await ns.sleep(10000);
	}
	while(servers.length > 0)	
}