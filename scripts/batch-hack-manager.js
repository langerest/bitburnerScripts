const argSchema = [
	['target', ''],
	['reserved_mem', 0],
	['server_weaken_rate', 1]
];

export function autocomplete(data, args) {
	data.flags(argSchema);
	return data.servers;
}

/** @param {import("../.").NS} ns */
export async function main(ns) {
	const args = ns.flags(argSchema);
	const target = args['target'];
	const reserved_mem = args['reserved_mem'];
	const server_weaken_rate = args['server_weaken_rate'];

	const host = ns.getHostname();

	//constant, potency of weaken threads
	const threadPotencyForWeaken = 0.05 * server_weaken_rate;
	// two weaken threads per 10 hack threads
	const threadHardeningForHack = 0.002;
	// four weaken threads per 5 grow threads
	const threadHardeningForGrow = 0.004;

	const hack_script = '/scripts/batch-hack/hack.js';
	const weaken_script = '/scripts/batch-hack/weaken.js';
	const grow_script = '/scripts/batch-hack/grow.js';
	const basic_hack = '/scripts/basic-hack.js';
	const manager_script = '/scripts/batch-hack-manager.js';

	var timeForGrow;
	var timeForWeaken;
	var timeForHack;

	const costForHack = ns.getScriptRam(hack_script);
	const costForWeaken = ns.getScriptRam(weaken_script);
	const costForGrow = ns.getScriptRam(grow_script);
	const script_mem = ns.getScriptRam(manager_script);

	const maxMoney = ns.getServerMaxMoney(target);
	const minSecurity = ns.getServerMinSecurityLevel(target);

	const step_delay = 50;
	const delay_for_kill = 200;
	const delay_to_prevent_freeze = 20;

	ns.disableLog('run');
	ns.disableLog('sleep');

	var script_to_kill = [hack_script, weaken_script, grow_script, basic_hack];

	for (const script of script_to_kill) {
		ns.scriptKill(script, host);
	}
	await ns.sleep(delay_for_kill);

	while (true) {
		do {
			var script_running = false;
			var script_to_check = [hack_script, weaken_script, grow_script];
			for (const script of script_to_kill) {
				if (ns.scriptRunning(script, host)) {
					script_running = true;
					await ns.sleep(delay_for_kill);
					break;
				}
			}
		}
		while (script_running)
		var available_ram = ns.getServerMaxRam(host) - Math.max(ns.getServerUsedRam(host), reserved_mem + script_mem);
		var currentSecurity = ns.getServerSecurityLevel(target);
		var currentMoney = ns.getServerMoneyAvailable(target);
		if (currentSecurity > minSecurity) {
			timeForWeaken = ns.getWeakenTime(target);
			var threads = Math.floor(available_ram / costForWeaken);
			try {
				ns.print(`Attempt to weaken '${target}' using ${threads} threads.`);
				ns.run(weaken_script, threads, target);
				var delay = timeForWeaken + delay_for_kill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} catch (error) {
				ns.print(error);
				await ns.sleep(delay_to_prevent_freeze);
			}
		} else if (currentMoney < maxMoney) {
			timeForGrow = ns.getGrowTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			var singleCycleCost = costForWeaken + costForGrow * threadPotencyForWeaken / threadHardeningForGrow;
			var cyclesAvailable = Math.floor(available_ram / singleCycleCost);
			var threadsForGrow = Math.floor(cyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow);
			var threadsForWeaken = Math.floor((available_ram - costForGrow * threadsForGrow) / costForWeaken);
			var grow_delay = (timeForWeaken - timeForGrow) - step_delay;
			try {
				ns.print(`Attempt to weaken '${target}' using ${threadsForWeaken} threads.`);
				ns.run(weaken_script, threadsForWeaken, target);
				ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
				ns.run(grow_script, threadsForGrow, target, grow_delay);
				var delay = timeForWeaken + delay_for_kill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} catch (error) {
				ns.print(error);
				await ns.sleep(delay_to_prevent_freeze);
			}
		} else {
			timeForHack = ns.getHackTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			timeForGrow = ns.getGrowTime(target);
			var perfection = false;
			var threadsForHack;
			var threadsForGrow;
			var threadsToWeakenFromHack;
			var threadsToWeakenFromGrow;
			var totalHackCost;
			var totalGrowCost;
			var percentageToSteal = 99;
			do {
				// calculate amount to steal and number of hack threads necessary
				var amountToSteal = maxMoney * (percentageToSteal / 100.0);
				threadsForHack = Math.floor(ns.hackAnalyzeThreads(target, amountToSteal));
				if (threadsForHack == 0) {
					threadsForHack = 1;
				}
				totalHackCost = threadsForHack * costForHack;

				// calculate amount needed to grow to replace what was stolen and how many grow threads necessary
				var coForGrowth = 1.0 / (1.0 - percentageToSteal / 100.0);
				threadsForGrow = Math.ceil((ns.growthAnalyze(target, coForGrowth, ns.getServer(host).cpuCores)) * 1.05);
				totalGrowCost = threadsForGrow * costForGrow;

				// calculate each amount of weakening needed to get back to minsec after our hack/grow threads
				var secIncreaseFromGrow = threadHardeningForGrow * threadsForGrow;
				var secIncreaseFromHack = threadHardeningForHack * threadsForHack;
				threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
				threadsToWeakenFromGrow = Math.ceil(secIncreaseFromGrow / threadPotencyForWeaken);
				var totalWeakenCost = (threadsToWeakenFromGrow + threadsToWeakenFromHack) * costForWeaken;

				// calculate how many threads we can run at once
				var totalCycleCost = totalHackCost + totalGrowCost + totalWeakenCost;
				var cycleThreadsAvailable = Math.floor(available_ram / totalCycleCost);
				if (cycleThreadsAvailable < 1) {
					if (percentageToSteal > 1) {
						percentageToSteal--;
					} else {
						ns.tprint(`Ram of '${host}' is too small to hack '${target}'. Aborting.`);
						return;
					}
				} else {
					perfection = true;
				}
			}
			while (!perfection)

			var singleGrowCycleCost = costForWeaken + costForGrow * threadPotencyForWeaken / threadHardeningForGrow;
			var growcyclesAvailable = Math.floor((available_ram - totalHackCost - threadsToWeakenFromHack * costForWeaken) / singleGrowCycleCost);
			threadsForGrow = Math.floor(growcyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow);
			threadsToWeakenFromGrow = Math.floor((available_ram - totalHackCost - threadsToWeakenFromHack * costForWeaken - costForGrow * threadsForGrow) / costForWeaken);

			var hack_delay = (timeForWeaken - timeForHack) - step_delay;
			var grow_delay = (timeForWeaken - timeForGrow) + step_delay;
			var weaken_for_grow_delay = step_delay * 2;
			try {
				ns.print(`Hack '${target}' for ${percentageToSteal} %.`);
				ns.print(`Attempt to weaken '${target}' using ${threadsToWeakenFromHack} threads.`);
				ns.run(weaken_script, threadsToWeakenFromHack, target);
				ns.print(`Attempt to hack '${target}' using ${threadsForHack} threads.`)
				ns.run(hack_script, threadsForHack, target, hack_delay);
				ns.print(`Attempt to weaken '${target}' using ${threadsToWeakenFromGrow} threads.`);
				ns.run(weaken_script, threadsToWeakenFromGrow, target, weaken_for_grow_delay);
				ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
				ns.run(grow_script, threadsForGrow, target, grow_delay);
				var delay = timeForWeaken + step_delay * 2 + delay_for_kill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} catch (error) {
				ns.tprint(error);
				await ns.sleep(delay_to_prevent_freeze);
			}
		}
	}
}