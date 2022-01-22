import { list_servers } from '/scripts/opened-servers.js'
import { root } from '/scripts/root.js'

/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];
	var min_ram = 128;
	if (ns.args.length > 1) {
		min_ram = ns.args[1];
	}

	if (!ns.hasRootAccess(target)) {
		root(ns, target);
	}

	const window_delay = 3000;
	const script_manager = "/scripts/batch-hack-manager.js";
    const home_reserved_mem = 25;

	const hack_script = '/scripts/batch-hack/hack.js';
	const weaken_script = '/scripts/batch-hack/weaken.js';
	const grow_script = '/scripts/batch-hack/grow.js';

	if (!ns.isRunning(script_manager, 'home', target, home_reserved_mem) && ns.getServerMaxRam('home') - home_reserved_mem > min_ram) {
        if(ns.scriptRunning(script_manager, 'home')) {
            ns.scriptKill(script_manager, 'home');
        }
        ns.exec(script_manager, 'home', 1, target, home_reserved_mem);
        await ns.sleep(window_delay);
    }
	var servers = list_servers(ns);
	for (var server of servers) {
		if (!ns.hasRootAccess(server)) {
			var root_access = root(ns, server);
			if (!root_access) {
				continue;
			}
		}
		if (server == 'home' || !ns.hasRootAccess(server) || ns.getServerMaxRam(server) < min_ram) {
			continue;
		}
		if (ns.isRunning(script_manager, server, target)) {
			continue;
		}
		ns.killall(server);
		var scripts = [script_manager, hack_script, weaken_script, grow_script];
		for (var script of scripts) {
			await ns.scp(script, 'home', server);
		}
		ns.tprint(`Launching script '${script_manager}' on server '${server}' with following arguments: ${target}.`);
		ns.exec(script_manager, server, 1, target);
		await ns.sleep(window_delay);
	}
}

export function autocomplete(data, args) {
    return data.servers;
}