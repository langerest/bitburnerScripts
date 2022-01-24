import { list_servers } from '/scripts/opened-servers.js'

/** @param {NS} ns **/
export function getHackRates(ns, ram, server, player) {
	server.hackDifficulty = server.minDifficulty;
	server.moneyAvailable = server.moneyMax;

	const server_weaken_rate = ns.getBitNodeMultipliers().ServerWeakenRate;
	//constant, potency of weaken threads
	const threadPotencyForWeaken = 0.05 * server_weaken_rate;
	// two weaken threads per 10 hack threads
	const threadHardeningForHack = 0.002;
	// four weaken threads per 5 grow threads
	const threadHardeningForGrow = 0.004;

	const hack_script = '/scripts/batch-hack/hack.js';
	const weaken_script = '/scripts/batch-hack/weaken.js';
	const grow_script = '/scripts/batch-hack/grow.js';
	const manager_script = '/scripts/batch-hack-manager.js';

	const costForHack = ns.getScriptRam(hack_script);
	const costForWeaken = ns.getScriptRam(weaken_script);
	const costForGrow = ns.getScriptRam(grow_script);
	const costForManager = ns.getScriptRam(manager_script);

	const step_delay = 50;

	var percentageToSteal = 99;
	var actualPercentageToSteal;
	var perfection = false;
	do {
		// calculate amount to steal and number of hack threads necessary
		//var amountToSteal = maxMoney * (percentageToSteal / 100.0);
		var hackPercent = ns.formulas.hacking.hackPercent(server, player);
		var threadsForHack = Math.floor(percentageToSteal / 100.0 / hackPercent);
		if (threadsForHack == 0) {
			threadsForHack = 1;
		}
		var totalHackCost = threadsForHack * costForHack;
		actualPercentageToSteal = hackPercent * threadsForHack;

		var secIncreaseFromHack = threadHardeningForHack * threadsForHack;
		var threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
		var totalWeakenFromHackCost = threadsToWeakenFromHack * costForWeaken

		var singleGrowCycleCost = costForWeaken + costForGrow * threadPotencyForWeaken / threadHardeningForGrow;
		var growcyclesAvailable = Math.floor((ram - costForManager - totalHackCost - totalWeakenFromHackCost) / singleGrowCycleCost);
		var threadsForGrow = Math.floor((growcyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow) / 1.1);
		var growPercent = ns.formulas.hacking.growPercent(server, threadsForGrow, player, 1);
		// calculate amount needed to grow to replace what was stolen and how many grow threads necessary
		if (growPercent < 1.0 / (1.0 - actualPercentageToSteal)) {
			if (percentageToSteal > 1) {
				percentageToSteal--;
			}
			else {
				return {
					percentage: 0,
					time: 0,
					rate: 0
				};
			}
		}
		else {
			perfection = true;
		}
	}
	while (!perfection)
	var timeForWeaken = ns.formulas.hacking.weakenTime(server, player);
	var cycle_time = timeForWeaken + step_delay * 3;
	return {
		percentage: actualPercentageToSteal,
		time: cycle_time,
		rate: server.moneyMax * actualPercentageToSteal / cycle_time * 1000
	};
}

export function getHackTarget(ns, ram) {
	const serverNames = list_servers(ns);
	var servers = serverNames.map(ns.getServer);
	const player = ns.getPlayer();

	servers = servers.filter(server => !server.purchasedByPlayer && (server.moneyMax || 0) > 0 &&
		server.hasAdminRights && server.requiredHackingSkill <= player.hacking);

	var results = []
	for (const server of servers) {
		var result = getHackRates(ns, ram, server, player);
		if (result['rate'] > 0 ){
			result['server'] = server.hostname;
			results.push(result);
		}
	}

	results.sort((a, b) => {return b['rate'] - a['rate'];});
	return results;
} 

/** @param {NS} ns **/
export async function main(ns) {
	const ram = ns.args[0];
	const results = getHackTarget(ns, ram);
	for (const result of results) {
		ns.tprint(`${result['server']}: hack percentage: ${Math.round(result['percentage'] * 100)}%, time: ${ns.tFormat(result['time'])}, rate: ${ns.nFormat(result['rate'], '0.000e+0')}`);
	}
}