import { NS, Server } from "..";
import { listServers } from "./opened-servers.js";

export interface BatchHackResult
{
	server: string,
	percentage: number,
	rate: number,
	time?: number,
	threadsForHack?: number,
	threadsForGrow?: number,
	threadsToWeakenFromHack?: number,
	threadsToWeakenFromGrow?: number
}

/** @param {import("../.").NS} ns **/
export function getHackRates(ns: NS, threads: number, target: Server, serverWeakenRate: number = 1.0): BatchHackResult
{
	if (target.minDifficulty === undefined || target.moneyMax === undefined)
	{
		return {
			server: target.hostname,
			percentage: 0,
			rate: 0
		};
	}

	target.hackDifficulty = target.minDifficulty;
	target.moneyAvailable = target.moneyMax;

	//constant, potency of weaken threads
	const threadPotencyForWeaken = 0.05 * serverWeakenRate;
	// two weaken threads per 10 hack threads
	const threadHardeningForHack = 0.002;
	// four weaken threads per 5 grow threads
	const threadHardeningForGrow = 0.004;

	const stepDelay = 50;

	var percentageToSteal = 99;
	var actualPercentageToSteal;
	var isPerfect = false;
	do 
	{
		// calculate amount to steal and number of hack threads necessary
		var hackPercent = ns.hackAnalyze(target.hostname);
		var threadsForHack = Math.max(Math.floor(percentageToSteal / 100.0 / hackPercent), 1);
		actualPercentageToSteal = Math.min(hackPercent * threadsForHack * 100, 99);
		
		// calculate amount needed to grow to replace what was stolen and how many grow threads necessary
		var coForGrowth = 1.0 / (1.0 - actualPercentageToSteal / 100.0);
		var threadsForGrow = Math.ceil((ns.growthAnalyze(target.hostname, coForGrowth)) * 1.05);

		// calculate each amount of weakening needed to get back to minsec after our hack/grow threads
		var secIncreaseFromGrow = threadHardeningForGrow * threadsForGrow;
		var secIncreaseFromHack = threadHardeningForHack * threadsForHack;
		var threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
		var threadsToWeakenFromGrow = Math.ceil(secIncreaseFromGrow / threadPotencyForWeaken);

		// calculate how many threads we can run at once
		var threadsCycle = threadsForHack + threadsForGrow + threadsToWeakenFromHack + threadsToWeakenFromGrow;
		var cyclesAvailable = Math.floor(threads / threadsCycle);

		// calculate amount needed to grow to replace what was stolen and how many grow threads necessary
		if (cyclesAvailable < 1) 
		{
			if (percentageToSteal > 1) 
			{
				percentageToSteal--;
			} 
			else 
			{
				return {
					server: target.hostname,
					percentage: 0,
					rate: 0
				};
			}
		} 
		else 
		{
			isPerfect = true;
		}
	}
	while (!isPerfect)
	
	var timeForWeaken = ns.getWeakenTime(target.hostname);
	var cycleTime = timeForWeaken + stepDelay * 3;
	return {
		server: target.hostname,
		percentage: actualPercentageToSteal,
		time: cycleTime,
		rate: target.moneyMax * actualPercentageToSteal / cycleTime * 10,
		threadsForHack: threadsForHack,
		threadsForGrow: threadsForGrow,
		threadsToWeakenFromHack: threadsToWeakenFromHack,
		threadsToWeakenFromGrow: threadsToWeakenFromGrow
	};
}

/** @param {import("../.").NS} ns */
export function getHackTarget(ns: NS, threads: number, serverWeakenRate: number = 1.0) 
{
	const serverNames = listServers(ns);
	var servers = serverNames.map(ns.getServer);
	const player = ns.getPlayer();
	servers = servers.filter(server => !server.purchasedByPlayer && (server.moneyMax || 0) > 0 &&
		server.hasAdminRights && server.requiredHackingSkill != undefined && server.requiredHackingSkill <= player.skills.hacking);
	var results: BatchHackResult[] = []
	for (const server of servers) 
	{
		var result = getHackRates(ns, threads, server, serverWeakenRate);
		if (result['rate'] > 0) 
		{
			results.push(result);
		}
	}

	results.sort((a, b) => {
		return b['rate'] - a['rate'];
	});

	return results;
}

/** @param {import("../.").NS} ns */
export function getAvailableThreads(ns: NS, server: Server, reservedRam: number = 0)
{
	const hackScript = 'batch-hack/hack.js';
	const weakenScript = 'batch-hack/weaken.js';
	const growScript = 'batch-hack/grow.js';
	const costForHack = ns.getScriptRam(hackScript);
	const costForWeaken = ns.getScriptRam(weakenScript);
	const costForGrow = ns.getScriptRam(growScript);
	const costPerThread = Math.max(costForHack, costForGrow, costForWeaken);

	return Math.floor((server.maxRam - reservedRam) / costPerThread);
}

/** @param {import("../.").NS} ns */
export function parseBatchHackResult(ns: NS, result: BatchHackResult)
{
	var expression = `${result.server}: hack percentage: ${Math.round(result.percentage)}%, rate: ${ns.formatNumber(result.rate)}`
	if (result.time !== undefined)
	{
		expression.concat(`,  time: ${ns.tFormat(result['time'])}`);
	}

	if (result.threadsForHack !== undefined)
	{
		expression.concat(`, threads for hack: ${result.threadsForHack}`);
	}

	if (result.threadsForGrow !== undefined)
	{
		expression.concat(`, threads for grow: ${result.threadsForGrow}`);
	}

	if (result.threadsToWeakenFromHack !== undefined)
	{
		expression.concat(`, threads to weaken from hack: ${result.threadsToWeakenFromHack}`);
	}

	if (result.threadsToWeakenFromGrow !== undefined)
	{
		expression.concat(`, threads to weaken from grow: ${result.threadsToWeakenFromGrow}`);
	}

	return expression;
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
	const threads = ns.args[0] as number;
	const bitnodeMultiplier = '/data/bitnode-multiplier.txt';
	var serverWeakenRate: number
	try 
	{
		serverWeakenRate = JSON.parse(ns.read(bitnodeMultiplier)).ServerWeakenRate;
	}
	catch (exception)
	{
		serverWeakenRate = 1.0;
	}

	const results = getHackTarget(ns, threads, serverWeakenRate);
	for (const result of results) 
	{
		ns.tprint(parseBatchHackResult(ns, result));
	}
}