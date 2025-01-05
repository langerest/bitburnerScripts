import { NS, Player, Server } from "..";
import { listServers, openedServers } from "./opened-servers.js";

//constant, base potency of weaken threads
const baseThreadPotencyForWeaken = 0.05;
// two weaken threads per 10 hack threads
const threadHardeningForHack = 0.002;
// four weaken threads per 5 grow threads
const threadHardeningForGrow = 0.004;

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

export interface BatchHackScripts
{
    hackScript: string,
    growScript: string,
    weakenScript: string
}

/** @param {import("../.").NS} ns **/
export function getThreadsForWeaken(ns: NS, threads: number, target: Server, serverWeakenRate: number = 1.0): BatchHackResult
{
    if (target.hackDifficulty === undefined || target.minDifficulty === undefined)
    {
        return {
            server: target.hostname,
            percentage: 0,
            rate: 0,
            threadsToWeakenFromGrow: 0
        };
    }

    //constant, potency of weaken threads
    const threadPotencyForWeaken = baseThreadPotencyForWeaken * serverWeakenRate;
    var threadsForWeaken = Math.max(Math.min(Math.ceil((target.hackDifficulty - target.minDifficulty) / threadPotencyForWeaken), 0), threads);
    return {
        server: target.hostname,
        percentage: 0,
        rate: 0,
        threadsToWeakenFromGrow: threadsForWeaken
    }
}

/** @param {import("../.").NS} ns **/
function getHackRatesWithoutFormula(ns: NS, target: Server, stepDelay: number = 50): BatchHackResult
{
    if (target.minDifficulty === undefined || target.moneyMax === undefined || 
        target.requiredHackingSkill === undefined || target.requiredHackingSkill > ns.getHackingLevel() * 0.5)
    {
        return {
            server: target.hostname,
            percentage: 0,
            rate: 0
        };
    }

    return {
        server: target.hostname,
        percentage: 0,
        rate: target.moneyMax / target.minDifficulty,
        time: ns.getWeakenTime(target.hostname) + stepDelay * 3
    };
}

/** @param {import("../.").NS} ns **/
function getHackRatesWithFormula(ns: NS, threads: number, target: Server, player: Player, serverWeakenRate: number = 1.0, stepDelay: number = 50): BatchHackResult
{
    if (threads < 4 || target.minDifficulty === undefined || target.moneyMax === undefined)
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
    const threadPotencyForWeaken = baseThreadPotencyForWeaken * serverWeakenRate;

    var percentageToSteal = 0.99;
    var actualPercentageToSteal;
    var isPerfect = false;
    // calculate amount to steal and number of hack threads necessary
    var hackPercent = ns.formulas.hacking.hackPercent(target, player);
    var maxThreadsForHack = Math.floor((threads - 2) / (1 + threadHardeningForHack / threadPotencyForWeaken));
    var threadsForHack = Math.min(Math.max(Math.floor(percentageToSteal / hackPercent), 1), maxThreadsForHack);
    do 
    {
        actualPercentageToSteal = Math.min(hackPercent * threadsForHack, 0.99);
		var threadsToWeakenFromHack = Math.ceil(threadsForHack * threadHardeningForHack / threadPotencyForWeaken);
		var threadsForGrow = Math.floor((threads - threadsForHack - threadsToWeakenFromHack) / (1 + threadHardeningForGrow / threadPotencyForWeaken));
		var growPercent = ns.formulas.hacking.growPercent(target, threadsForGrow, player);

        if (growPercent >= 1.0 / (1.0 - actualPercentageToSteal)) 
        {
            isPerfect = true;
            continue;
        }

        if (threadsForHack <= 1) 
        {
            return {
                server: target.hostname,
                percentage: 0,
                rate: 0
            };
        } 
        
        threadsForHack --;
    }
    while (!isPerfect)

    var threadsToWeakenFromGrow = Math.ceil(threadsForGrow * threadHardeningForGrow / threadPotencyForWeaken);
    var timeForWeaken = ns.getWeakenTime(target.hostname);
    var cycleTime = timeForWeaken + stepDelay * 3;
    return {
        server: target.hostname,
        percentage: actualPercentageToSteal,
        time: cycleTime,
        rate: target.moneyMax * actualPercentageToSteal * ns.formulas.hacking.hackChance(target, player) / cycleTime * 1000,
        threadsForHack: threadsForHack,
        threadsForGrow: threadsForGrow,
        threadsToWeakenFromHack: threadsToWeakenFromHack,
        threadsToWeakenFromGrow: threadsToWeakenFromGrow
    };
}

/** @param {import("../.").NS} ns **/
export function getHackRates(ns: NS, threads: number, target: Server, serverWeakenRate: number = 1.0, stepDelay: number = 50)
{
    if (ns.fileExists("Formulas.exe", "home"))
    {
        let player = ns.getPlayer();
        return getHackRatesWithFormula(ns, threads, target, player, serverWeakenRate, stepDelay);
    }

    return getHackRatesWithoutFormula(ns, target, stepDelay);
}

/** @param {import("../.").NS} ns */
export function getHackTarget(ns: NS, threads: number, serverWeakenRate: number = 1.0, stepDelay: number = 50) 
{
    const serverNames = listServers(ns);
    var servers = serverNames.map(ns.getServer)
        .filter(server => !server.purchasedByPlayer && (server.moneyMax || 0) > 0 &&
        server.hasAdminRights && server.requiredHackingSkill != undefined && server.requiredHackingSkill <= ns.getHackingLevel());
    return servers.map(server => getHackRates(ns, threads, server, serverWeakenRate, stepDelay))
        .filter(result => result.rate > 0)
        .sort((a, b) => (b.rate - a.rate));
}

export function getBatchHackScripts(): BatchHackScripts
{
    const hackScript = 'hacking/hack.js';
    const growScript = 'hacking/grow.js';
    const weakenScript = 'hacking/weaken.js';
    
    return {
        hackScript: hackScript,
        growScript: growScript,
        weakenScript: weakenScript
    }
}

/** @param {import("../.").NS} ns */
export function getAvailableThreads(ns: NS, server: Server, reservedRam: number = 0)
{
    var batchHackScripts = getBatchHackScripts();
    const costPerThread = (Object.values(batchHackScripts) as string[])
        .map(script => ns.getScriptRam(script))
        .reduce((a, b) => Math.max(a, b));

    return Math.floor((server.maxRam - reservedRam) / costPerThread);
}

/** @param {import("../.").NS} ns */
export function getTotalAvailableThreads(ns: NS)
{
    const serverNames = openedServers(ns);
    var servers = serverNames.map(ns.getServer);
    return servers.map(server => getAvailableThreads(ns, server))
        .reduce((a, b) => a + b);
}

/** @param {import("../.").NS} ns */
export function parseBatchHackResult(ns: NS, result: BatchHackResult)
{
    var expression = `${result.server}: hack percentage: ${ns.formatPercent(result.percentage)}, rate: ${ns.formatNumber(result.rate)}`
    if (result.time !== undefined)
    {
        expression = expression.concat(`, time: ${ns.tFormat(result['time'])}`);
    }

    if (result.threadsForHack !== undefined)
    {
        expression = expression.concat(`, threads for hack: ${result.threadsForHack}`);
    }

    if (result.threadsForGrow !== undefined)
    {
        expression = expression.concat(`, threads for grow: ${result.threadsForGrow}`);
    }

    if (result.threadsToWeakenFromHack !== undefined)
    {
        expression = expression.concat(`, threads to weaken from hack: ${result.threadsToWeakenFromHack}`);
    }

    if (result.threadsToWeakenFromGrow !== undefined)
    {
        expression = expression.concat(`, threads to weaken from grow: ${result.threadsToWeakenFromGrow}`);
    }

    return expression;
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
    var threads: number;
    if (ns.args.length > 0)
    {
        threads = ns.args[0] as number;
    }
    else
    {
        threads = getTotalAvailableThreads(ns);
    }
    
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
    ns.tprint(`Batch hacking for ${threads} threads:`);
    for (const result of results) 
    {
        ns.tprint(parseBatchHackResult(ns, result));
    }
}