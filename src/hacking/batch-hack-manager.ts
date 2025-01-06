import { NS, ScriptArg, AutocompleteData } from "../..";
import { BatchHackJob } from "./batch-hack-base";

const argSchema = 
[
    ['target', ''],
    ['reservedRam', 0],
    ['serverWeakenRate', 1]
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) 
{
    data.flags(argSchema);
    return data.servers;
}

/** @param {import("../..").NS} ns */
export async function main(ns: NS) 
{
    const args = ns.flags(argSchema);
    const target = args['target'] as string;
    const reservedRam = args['reservedRam'] as number;
    const serverWeakenRate = args['serverWeakenRate'] as number;

    const host = ns.getHostname();

    //constant, potency of weaken threads
    const threadPotencyForWeaken = 0.05 * serverWeakenRate;
    // two weaken threads per 10 hack threads
    const threadHardeningForHack = 0.002;
    // four weaken threads per 5 grow threads
    const threadHardeningForGrow = 0.004;

    const hackScript = 'hacking/hack.js';
    const weakenScript = 'hacking/weaken.js';
    const growScript = 'hacking/grow.js';
    const basicHackScript = 'hacking/basic-hack.js';
    const batchHackManagerScript = 'hacking/batch-hack-manager.js';

    var timeForGrow;
    var timeForWeaken;
    var timeForHack;

    const costForHack = ns.getScriptRam(hackScript);
    const costForWeaken = ns.getScriptRam(weakenScript);
    const costForGrow = ns.getScriptRam(growScript);
    const scriptRam = ns.getScriptRam(batchHackManagerScript);

    const maxMoney = ns.getServerMaxMoney(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);

    const stepDelay = 10;
    const offsetDelay = 100;
    const delayForKill = 200;
    const delayToPreventFreeze = 20;

    let cpuCores;
    if (host === "home")
    {
        cpuCores = ns.getServer(host).cpuCores;
    }
    else
    {
        cpuCores = 1;
    }

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
        var availableRam = ns.getServerMaxRam(host) - Math.max(ns.getServerUsedRam(host), reservedRam + scriptRam);
        var currentSecurity = ns.getServerSecurityLevel(target);
        var currentMoney = ns.getServerMoneyAvailable(target);
        if (currentSecurity > minSecurity) 
        {
            timeForWeaken = ns.getWeakenTime(target);
            var threads = Math.floor(availableRam / costForWeaken);
            let currentTime = Date.now()
            let startTime = currentTime + offsetDelay;
            let job = new BatchHackJob(ns, target, startTime, true);
            try 
            {
                ns.print(`Attempt to weaken '${target}' using ${threads} threads.`);
                ns.run(weakenScript, threads, JSON.stringify(job));
                await ns.nextPortWrite(job.port);
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
            var cyclesAvailable = availableRam / singleCycleCost;
            var threadsForGrow = Math.max(Math.floor(cyclesAvailable * threadPotencyForWeaken / threadHardeningForGrow), 1);
            var threadsForWeaken = Math.max(Math.floor((availableRam - costForGrow * threadsForGrow) / costForWeaken), 1);
            var growDelay = (timeForWeaken - timeForGrow) - stepDelay;
            let currentTime = Date.now()
            let weakenStartTime = currentTime + offsetDelay;
            let growStartTime = weakenStartTime + growDelay;
            let weakenJob = new BatchHackJob(ns, target, weakenStartTime, true);
            let growJob = new BatchHackJob(ns, target, growStartTime, false);
            try 
            {
                ns.print(`Attempt to weaken '${target}' using ${threadsForWeaken} threads.`);
                ns.run(weakenScript, threadsForWeaken, JSON.stringify(weakenJob));
                ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
                ns.run(growScript, threadsForGrow, JSON.stringify(growJob));
                await ns.nextPortWrite(weakenJob.port);
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
            var threadsForHack: number;
            var threadsForGrow: number;
            var threadsToWeakenFromHack: number;
            var threadsToWeakenFromGrow: number;
            var totalHackCost: number;
            var totalGrowCost: number;
            var percentageToSteal = 0.99;
            // calculate amount to steal and number of hack threads necessary
            var amountToSteal = maxMoney * percentageToSteal;
            threadsForHack = Math.max(Math.floor(ns.hackAnalyzeThreads(target, amountToSteal)), 1);
            threadsForHack = Math.min(threadsForHack, Math.floor(availableRam / costForHack));
            let minThreadsNotWorking = threadsForHack + 1;
            let maxThreadsWorking = 0;
            while (minThreadsNotWorking - maxThreadsWorking > 1)
            {
                percentageToSteal = Math.min(ns.hackAnalyze(target) * threadsForHack, 0.99);
                totalHackCost = threadsForHack * costForHack;

                // calculate amount needed to grow to replace what was stolen and how many grow threads necessary
                let coForGrowth = 1.0 / (1.0 - percentageToSteal);
                threadsForGrow = Math.ceil(ns.growthAnalyze(target, coForGrowth, cpuCores) * 1.05);
                totalGrowCost = threadsForGrow * costForGrow;

                // calculate each amount of weakening needed to get back to minsec after our hack/grow threads
                let secIncreaseFromGrow = threadHardeningForGrow * threadsForGrow;
                let secIncreaseFromHack = threadHardeningForHack * threadsForHack;
                threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
                threadsToWeakenFromGrow = Math.ceil(secIncreaseFromGrow / threadPotencyForWeaken);
                let totalWeakenCost = (threadsToWeakenFromGrow + threadsToWeakenFromHack) * costForWeaken;

                // calculate how many threads we can run at once
                let totalCycleCost = totalHackCost + totalGrowCost + totalWeakenCost;
                let cycleThreadsAvailable = Math.floor(availableRam / totalCycleCost);
                if (cycleThreadsAvailable >= 1) 
                {
                    maxThreadsWorking = threadsForHack;
                }
                else
                {
                    minThreadsNotWorking = threadsForHack;
                }

                threadsForHack = Math.max(Math.floor((maxThreadsWorking + minThreadsNotWorking) / 2), maxThreadsWorking + 1);
            }

            threadsForHack = maxThreadsWorking;
            if (threadsForHack < 1)
            {
                ns.tprint(`Ram of '${host}' is too small to hack '${target}'. Aborting.`);
                return;
            }

            percentageToSteal = Math.min(ns.hackAnalyze(target) * threadsForHack, 0.99);
            totalHackCost = threadsForHack * costForHack;

            // calculate amount needed to grow to replace what was stolen and how many grow threads necessary
            var coForGrowth = 1.0 / (1.0 - percentageToSteal);
            threadsForGrow = Math.ceil(ns.growthAnalyze(target, coForGrowth, cpuCores) * 1.05);
            totalGrowCost = threadsForGrow * costForGrow;

            // calculate each amount of weakening needed to get back to minsec after our hack/grow threads
            var secIncreaseFromGrow = threadHardeningForGrow * threadsForGrow;
            var secIncreaseFromHack = threadHardeningForHack * threadsForHack;
            threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
            threadsToWeakenFromGrow = Math.ceil(secIncreaseFromGrow / threadPotencyForWeaken);

            var hackDelay = (timeForWeaken - timeForHack) - stepDelay;
            var growDelay = (timeForWeaken - timeForGrow) + stepDelay;
            let currentTime = Date.now()
            let weakenForHackStartTime = currentTime + offsetDelay;
            let weakenForGrowStartTime = weakenForHackStartTime + stepDelay * 2;
            let hackStartTime = weakenForHackStartTime + hackDelay;
            let growStartTime = weakenForHackStartTime + growDelay;
            let weakenForHackJob = new BatchHackJob(ns, target, weakenForHackStartTime, false);
            let weakenForGrowJob = new BatchHackJob(ns, target, weakenForGrowStartTime, true);
            let growJob = new BatchHackJob(ns, target, growStartTime, false);
            let hackJob = new BatchHackJob(ns, target, hackStartTime, false);
            try 
            {
                ns.print(`Hack '${target}' for ${ns.formatPercent(percentageToSteal)}.`);
                ns.print(`Attempt to weaken '${target}' for hack using ${threadsToWeakenFromHack} threads.`);
                ns.run(weakenScript, threadsToWeakenFromHack, JSON.stringify(weakenForHackJob));
                ns.print(`Attempt to weaken '${target}' for grow using ${threadsToWeakenFromGrow} threads.`);
                ns.run(weakenScript, threadsToWeakenFromGrow, JSON.stringify(weakenForGrowJob));
                ns.print(`Attempt to grow '${target}' using ${threadsForGrow} threads.`)
                ns.run(growScript, threadsForGrow, JSON.stringify(growJob));
                ns.print(`Attempt to hack '${target}' using ${threadsForHack} threads.`)
                ns.run(hackScript, threadsForHack, JSON.stringify(hackJob));
                await ns.nextPortWrite(weakenForGrowJob.port);
            } 
            catch (exception) 
            {
                ns.tprint(exception);
                await ns.sleep(delayToPreventFreeze);
            }
        }
    }
}