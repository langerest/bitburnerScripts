import { list_servers } from '/scripts/opened-servers.js'
import { getHackTarget } from '/scripts/hack-target-calculator.js'

const argSchema = [
	['min_ram', 128],
	['max_time', 300000],
	['no_kill', false]
];

export function autocomplete(data, args) {
	data.flags(argSchema);
	return [];
}

/** @param {NS} ns **/
export async function main(ns) {
	const args = ns.flags(argSchema);
	const min_ram = args['min_ram'];
	const max_time = args['max_time'];

	const script_manager = "/scripts/batch-hack-manager.js";
	const home_reserved_mem = 128;
	const server_weaken_rate = ns.getBitNodeMultipliers().ServerWeakenRate;

	const hack_script = '/scripts/batch-hack/hack.js';
	const weaken_script = '/scripts/batch-hack/weaken.js';
	const grow_script = '/scripts/batch-hack/grow.js';
	const basic_hack = '/scripts/basic-hack.js';

	var serverNames = list_servers(ns);
	serverNames.push('home');
	var servers = serverNames.map(ns.getServer);
	servers = servers.filter(server => server.hasAdminRights && (server.maxRam >= min_ram ||
		(server.hostname == 'home' && server.maxRam >= min_ram + home_reserved_mem)));

	if(args['no_kill']) {
		servers = servers.filter(server => !ns.scriptRunning(script_manager, server.hostname));
	}

	servers.sort((a, b) => b.hostname == 'home'?b.maxRam-home_reserved_mem:b.maxRam - a.hostname == 'home'?a.maxRam-home_reserved_mem:a.maxRam);

	//ns.tprint(servers.map((a) => a.hostname));

	var targets = {};
	var target_ram_dict = {};
	for (const server of servers) {
		var ram = server.maxRam;
		if (server.hostname == 'home') {
			ram -= home_reserved_mem;
		}
		if (!(ram.toString() in targets)) {
			var target_list = getHackTarget(ns, ram);
			
			target_list = target_list.filter(result => (result['time'] <= max_time));
			target_list = target_list.filter(result => (result['rate'] >= target_list[0]['rate'] * 0.5));
			//ns.tprint(target_list);
			target_ram_dict[ram.toString()] = target_list;
			for (const result of target_list) {
				if (!(result['server'] in targets)) {
					targets[result['server']] = [];
				}
			}
		}
		target_ram_dict[ram.toString()].sort((a, b) => {
			if (targets[a['server']].length == targets[b['server']].length) {
				return b['rate'] - a['rate'];
			}
			return targets[a['server']].length - targets[b['server']].length;
		})
		//ns.tprint(target_ram_dict[ram.toString()]);
		if (target_ram_dict[ram.toString()].length > 0) {
			targets[target_ram_dict[ram.toString()][0]['server']].push(server);
		}
	}

	var targets_length = Object.values(targets).map((a) => a.length);
	const window_delay = Math.max(3000, max_time / Math.max(...targets_length) / 2);

	var i = 0;
	while (Object.keys(targets).length > 0) {
		for (const target in targets) {
			if (targets[target].length <= i) {
				delete targets[target];
			}
			else {
				const server = targets[target][i];
				if (server.hostname == 'home') {
					if (!ns.isRunning(script_manager, 'home', '--target', target, '--reserved_mem', home_reserved_mem, '--server_weaken_rate', server_weaken_rate)) {
						ns.scriptKill(script_manager, 'home');
						ns.scriptKill(basic_hack, 'home');
						ns.tprint(`Launching script '${script_manager}' on server 'home' targeting '${target}'.`);
						ns.exec(script_manager, 'home', 1, '--target', target, '--reserved_mem', home_reserved_mem, '--server_weaken_rate', server_weaken_rate);
					}
				}
				else {
					if (!ns.isRunning(script_manager, server.hostname, '--target', target, '--server_weaken_rate', server_weaken_rate)) {
						ns.killall(server.hostname);
						for (const script of [script_manager, hack_script, grow_script, weaken_script]) {
							await ns.scp(script, server.hostname);
						}
						ns.tprint(`Launching script '${script_manager}' on server '${server.hostname}' targeting '${target}'.`);
						ns.exec(script_manager, server.hostname, 1, '--target', target, '--server_weaken_rate', server_weaken_rate);
					}
				}
			}
		}
		i++;
		ns.tprint(`Sleep for ${ns.tFormat(window_delay, true)}.`);
		await ns.sleep(window_delay);
	}
}