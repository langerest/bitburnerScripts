import { listServers } from './opened-servers.js'

/** @param {import("../.").NS} ns */
async function scan(ns, parent, server, list) {
	const children = ns.scan(server);
	if (list.includes(server)) {
		try {
			await ns.installBackdoor();
			ns.tprint(`Installed backdoor on '${server}'.`);
		} catch (error) {
			ns.print(error);
		}
	}
	for (const child of children) {
		if (parent == child) {
			continue;
		}
		ns.connect(child);
		await scan(ns, server, child, list);
	}
	if (parent) {
		ns.connect(parent);
	}
}

/** @param {import("../.").NS} ns */
export async function main(ns) {
	var servers;
	const important_servers = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'w0r1d_d43m0n'];
	do {
		servers = listServers(ns);
		servers = servers.filter(server => server != 'home' && !ns.getServer(server).backdoorInstalled && !ns.getServer(server).purchasedByPlayer);
		var i_servers = servers.filter(server => important_servers.includes(server));
		if (i_servers.length) {
			await scan(ns, '', 'home', i_servers);
			await ns.sleep(60000);
		} else {
			await scan(ns, '', 'home', servers);
			if (servers.length) {
				await ns.sleep(60000);
			}
		}
	}
	while (servers.length)
}