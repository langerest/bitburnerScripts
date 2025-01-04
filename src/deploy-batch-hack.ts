import { NS, ScriptArg, AutocompleteData, Server } from "..";
import { listServers } from './opened-servers.js'
import { BatchHackResult, getHackTarget } from './hack-target-calculator.js'

const argSchema = 
[
    ['minRam', 32],
    ['maxTime', 300000],
    ['homeReservedRam', 32],
    ['noKill', false],
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg) 
{
    data.flags(argSchema);
    return [];
}

/** @param {import("..").NS} ns */
export async function main(ns: NS) 
{
    const args = ns.flags(argSchema);
    const minRam = args['minRam'] as number;
    const maxTime = args['maxTime'] as number;
    const homeReservedRam = args['homeReservedRam'] as number;
    const bitnodeMultiplier = 'data/bitnode-multiplier.txt';
    var serverWeakenRate;
    try
    {
        serverWeakenRate = JSON.parse(ns.read(bitnodeMultiplier)).ServerWeakenRate;
    }
    catch (exception)
    {
        serverWeakenRate = 1.0;
    }

    const hackScript = 'hacking/hack.js';
    const weakenScript = 'hacking/weaken.js';
    const growScript = 'hacking/grow.js';
    const basicHackScript = 'hacking/basic-hack.js';
    const batchHackManagerScript = "hacking/batch-hack-manager.js";

    const costForHack = ns.getScriptRam(hackScript);
    const costForWeaken = ns.getScriptRam(weakenScript);
    const costForGrow = ns.getScriptRam(growScript);
    const costPerThread = Math.max(costForHack, costForGrow, costForWeaken);
    const costForManager = ns.getScriptRam(batchHackManagerScript);

    const scripts = [batchHackManagerScript, hackScript, growScript, weakenScript]

    var serverNames = listServers(ns);
    serverNames.push('home');
    var servers = serverNames.map(ns.getServer);
    servers = servers.filter(server => !server.hostname.startsWith('hacknet-node-') && server.hasAdminRights && (server.maxRam >= minRam ||
        (server.hostname == 'home' && server.maxRam >= minRam + homeReservedRam)));

    if (args['noKill']) 
    {
        servers = servers.filter(server => !ns.scriptRunning(batchHackManagerScript, server.hostname));
    }

    servers.sort((a, b) => (b.hostname == 'home' ? b.maxRam - homeReservedRam : b.maxRam) - (a.hostname == 'home' ? a.maxRam - homeReservedRam : a.maxRam));
    //ns.tprint(servers.map((a) => a.hostname));

    var targetsHostsMap: { [key: string]: Server[]; } = {};
    var targetsthreadsMap: { [key: string]: BatchHackResult[]; } = {};
    for (const host of servers) 
    {
        var ram = (host.hostname == 'home' ? host.maxRam - homeReservedRam : host.maxRam) - costForManager;
        var threads = Math.floor(ram / costPerThread);
        if (threads < 1) 
        {
            continue;
        }

        if (!(threads.toString() in targetsthreadsMap)) 
        {
            var targetResults = getHackTarget(ns, threads, serverWeakenRate);
            ns.tprint(targetResults);

            targetResults = targetResults.filter(result => (result.time !== undefined && result.time <= maxTime));
            targetResults = targetResults.filter(result => (result.rate >= targetResults[0].rate * 0.5));
            targetsthreadsMap[threads.toString()] = targetResults;
            for (const result of targetResults) 
            {
                if (!(result.server in targetsHostsMap)) 
                {
                    targetsHostsMap[result.server] = [];
                }
            }
        }

        targetsthreadsMap[threads.toString()].sort((a, b) => (
            targetsHostsMap[a.server].length === targetsHostsMap[b.server].length ? 
            b.rate - a.rate : 
            targetsHostsMap[a.server].length - targetsHostsMap[b.server].length));

        //ns.tprint(targetsRamMap[threads.toString()]);

        if (targetsthreadsMap[threads.toString()].length > 0) 
        {
            targetsHostsMap[targetsthreadsMap[threads.toString()][0].server].push(host);
        }
    }

    var targetsLength = Object.values(targetsHostsMap).map((a) => a.length);
    const windowDelay = Math.max(3000, maxTime / Math.max(...targetsLength) / 2);

    var targetIndex = 0;
    while (Object.keys(targetsHostsMap).length > 0) 
    {
        for (const target in targetsHostsMap) 
        {
            if (targetsHostsMap[target].length <= targetIndex) 
            {
                delete targetsHostsMap[target];
            } 
            else 
            {
                const host = targetsHostsMap[target][targetIndex];
                if (host.hostname == 'home') 
                {
                    if (!ns.isRunning(batchHackManagerScript, 'home', '--target', target, '--reservedRam', homeReservedRam, '--serverWeakenRate', serverWeakenRate)) {
                        ns.scriptKill(batchHackManagerScript, 'home');
                        ns.scriptKill(basicHackScript, 'home');
                        ns.tprint(`Launching script '${batchHackManagerScript}' on server 'home' targeting '${target}'.`);
                        ns.exec(batchHackManagerScript, 'home', 1, '--target', target, '--reservedRam', homeReservedRam, '--serverWeakenRate', serverWeakenRate);
                    }
                } 
                else 
                {
                    if (!ns.isRunning(batchHackManagerScript, host.hostname, '--target', target, '--serverWeakenRate', serverWeakenRate)) {
                        ns.killall(host.hostname);
                        await ns.scp(scripts, host.hostname);
                        ns.tprint(`Launching script '${batchHackManagerScript}' on server '${host.hostname}' targeting '${target}'.`);
                        ns.exec(batchHackManagerScript, host.hostname, 1, '--target', target, '--serverWeakenRate', serverWeakenRate);
                    }
                }
            }
        }

        targetIndex++;
        ns.tprint(`Sleep for ${ns.tFormat(windowDelay, true)}.`);
        await ns.sleep(windowDelay);
    }
}