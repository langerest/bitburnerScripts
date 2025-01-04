const argSchema = 
[
	['target', ''],
	['reservedRam', 0],
	['serverWeakenRate', 1]
];

export function autocomplete(data, args) 
{
	data.flags(argSchema);
	return data.servers;
}

/** @param {import("..").NS} ns */
export async function main(ns) 
{
	const args = ns.flags(argSchema);
	const target = args['target'];
	const reservedRam = args['reservedRam'];
	const serverWeakenRate = args['serverWeakenRate'];

	const host = ns.getHostname();

	//constant, potency of weaken threads
	const threadPotencyForWeaken = 0.05 * serverWeakenRate;
	// two weaken threads per 10 hack threads
	const threadHardeningForHack = 0.002;
	// four weaken threads per 5 grow threads
	const threadHardeningForGrow = 0.004;

	const hackScript = 'batch-hack/hack.js';
	const weakenScript = 'batch-hack/weaken.js';
	const growScript = 'batch-hack/grow.js';
	const basicHackScript = 'basic-hack.ts';
	const batchHackManagerScript = 'batch-hack-manager.js';

	var timeForGrow;
	var timeForWeaken;
	var timeForHack;

	const costForHack = ns.getScriptRam(hackScript);
	const costForWeaken = ns.getScriptRam(weakenScript);
	const costForGrow = ns.getScriptRam(growScript);
	const scriptRam = ns.getScriptRam(batchHackManagerScript);

	const maxMoney = ns.getServerMaxMoney(target);
	const minSecurity = ns.getServerMinSecurityLevel(target);

	const stepDelay = 50;
	const delayForKill = 200;
	const delayToPreventFreeze = 20;

	ns.disableLog('run');
	ns.disableLog('sleep');

	var scriptsToKill = [hackScript, weakenScript, growScript, basicHackScript];

	for (const script of scriptsToKill) 
	{
		ns.scriptKill(script, host);
	}

	await ns.sleep(delayForKill);

	while (true) 
	{
		do 
		{
			var scriptRunning = false;
			for (const script of scriptsToKill) 
			{
				if (ns.scriptRunning(script, host)) 
				{
					scriptRunning = true;
					await ns.sleep(delayForKill);
					break;
				}
			}
		}
		while (scriptRunning)
		
		var availableRam = ns.getServerMaxRam(host) - Math.max(ns.getServerUsedRam(host), reservedRam + scriptRam);
		var currentSecurity = ns.getServerSecurityLevel(target);
		var currentMoney = ns.getServerMoneyAvailable(target);
		if (currentSecurity > minSecurity) 
		{
			timeForWeaken = ns.getWeakenTime(target);
			var threads = Math.floor(availableRam / costForWeaken);
			try 
			{
				ns.print(`Attempt to weaken '${target}' using ${threads} threads.`);
				ns.run(weakenScript, threads, target);
				var delay = timeForWeaken + delayForKill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} 
			catch (exception) 
			{
				ns.print(exception);
				await ns.sleep(delayToPreventFreeze);
			}
		} 
		else if (currentMoney < maxMoney) 
		{
			timeForGrow = ns.getGrowTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			var singleCycleCost = costForWeaken + costForGrow * threadPotencyForWeaken / threadHardeningForGrow;
			var cyclesAvailable = Math.floor(availableRam / singleCycleCost);
			var threadsForGrow = Math.max(Math.floor(cyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow), 1);
			var threadsForWeaken = Math.max(Math.floor((availableRam - costForGrow * threadsForGrow) / costForWeaken), 1);
			var growDelay = (timeForWeaken - timeForGrow) - stepDelay;
			try 
			{
				ns.print(`Attempt to weaken '${target}' using ${threadsForWeaken} threads.`);
				ns.run(weakenScript, threadsForWeaken, target);
				ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
				ns.run(growScript, threadsForGrow, target, growDelay);
				var delay = timeForWeaken + delayForKill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} 
			catch (exception) 
			{
				ns.print(exception);
				await ns.sleep(delayToPreventFreeze);
			}
		} 
		else 
		{
			timeForHack = ns.getHackTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			timeForGrow = ns.getGrowTime(target);
			var isPerfect = false;
			var threadsForHack;
			var threadsForGrow;
			var threadsToWeakenFromHack;
			var threadsToWeakenFromGrow;
			var totalHackCost;
			var totalGrowCost;
			var percentageToSteal = 99;
			do 
			{
				// calculate amount to steal and number of hack threads necessary
				var amountToSteal = maxMoney * (percentageToSteal / 100.0);
				threadsForHack = Math.max(Math.floor(ns.hackAnalyzeThreads(target, amountToSteal)), 1);
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
				var cycleThreadsAvailable = Math.floor(availableRam / totalCycleCost);
				if (cycleThreadsAvailable < 1) 
				{
					if (percentageToSteal > 1) 
					{
						percentageToSteal--;
					} 
					else 
					{
						ns.tprint(`Ram of '${host}' is too small to hack '${target}'. Aborting.`);
						return;
					}
				} 
				else 
				{
					isPerfect = true;
				}
			}
			while (!isPerfect)

			var singleGrowCycleCost = costForWeaken + costForGrow * threadPotencyForWeaken / threadHardeningForGrow;
			var growcyclesAvailable = Math.floor((availableRam - totalHackCost - threadsToWeakenFromHack * costForWeaken) / singleGrowCycleCost);
			threadsForGrow = Math.max(Math.floor(growcyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow), 1);
			threadsToWeakenFromGrow = Math.max(Math.floor((availableRam - totalHackCost - threadsToWeakenFromHack * costForWeaken - costForGrow * threadsForGrow) / costForWeaken), 1);

			var hackDelay = (timeForWeaken - timeForHack) - stepDelay;
			var growDelay = (timeForWeaken - timeForGrow) + stepDelay;
			var weakenForGrowDelay = stepDelay * 2;
			try 
			{
				ns.print(`Hack '${target}' for ${percentageToSteal} %.`);
				ns.print(`Attempt to weaken '${target}' using ${threadsToWeakenFromHack} threads.`);
				ns.run(weakenScript, threadsToWeakenFromHack, target);
				ns.print(`Attempt to hack '${target}' using ${threadsForHack} threads.`)
				ns.run(hackScript, threadsForHack, target, hackDelay);
				ns.print(`Attempt to weaken '${target}' using ${threadsToWeakenFromGrow} threads.`);
				ns.run(weakenScript, threadsToWeakenFromGrow, target, weakenForGrowDelay);
				ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
				ns.run(growScript, threadsForGrow, target, growDelay);
				var delay = timeForWeaken + stepDelay * 2 + delayForKill;
				ns.print(`Sleep for ${ns.tFormat(delay, true)}.`);
				await ns.sleep(delay);
			} 
			catch (exception) 
			{
				ns.tprint(exception);
				await ns.sleep(delayToPreventFreeze);
			}
		}
	}
}