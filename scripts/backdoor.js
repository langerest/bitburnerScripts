import { list_servers } from '/scripts/opened-servers.js'

/** @param {import("../.").NS} ns */
async function scan(ns, parent, server, list) {
    const children = ns.scan(server);
	if (list.includes(server)) {
		try {
			await ns.installBackdoor();
			ns.tprint(`Installed backdoor on '${server}'.`);
		}
		catch (error) {
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
	var servers = list_servers(ns);
	while (servers.length) {
		servers = servers.filter(server => server != 'home' && !ns.getServer(server).backdoorInstalled && !ns.getServer(server).purchasedByPlayer);
		// ns.tprint(servers);
		await scan(ns, '', 'home', servers);
		if (servers.length) {
			await ns.sleep(60000);
		}	
	}	
}