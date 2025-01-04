import { NS, ScriptArg, AutocompleteData } from "..";
import { deploy } from './deploy.js'
import { listServers } from './opened-servers.js'

/** @param {import("../.").NS} ns */
export async function deployBasicHack(ns: NS, target: string, maxRam: number = 0, homeReservedRam: number = 32)
{
    const script = "basic-hack.js";

    if (!ns.hasRootAccess(target))
    {
        ns.tprint(`No root access to ${target}.`);
        return;
    }

    if (!ns.isRunning(script, 'home', target)) 
    {
        if (ns.scriptRunning(script, 'home')) 
        {
            ns.scriptKill(script, 'home');
        }

        if (maxRam == 0 || ns.getServerMaxRam('home') - homeReservedRam < maxRam) 
        {
            await deploy(ns, 'home', script, [target], homeReservedRam);
        }
    }

    var servers = listServers(ns);
    servers = servers.filter(s => s != 'home' && !s.startsWith('hacknet-node-') && ns.hasRootAccess(s) && (maxRam == 0 || ns.getServerMaxRam(s) < maxRam));

    for (const server of servers) 
    {
        if (!ns.isRunning(script, server, target)) 
        {
            ns.killall(server);
            await deploy(ns, server, script, [target]);
        }
    }
}

const argSchema = 
[
    ['target', 'n00dles'],
    ['maxRam', 0], // The maximum server max ram to run the script. 0 means unlimited.
    ['homeReservedRam', 32], // Ram reserved for home.
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) 
{
    data.flags(argSchema);
    return data.servers;
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
    const args = ns.flags(argSchema);
    const target = args['target'] as string;
    const maxRam = args['maxRam'] as number;
    const homeReservedRam = args['homeReservedRam'] as number;

    while (!ns.hasRootAccess(target)) 
    {
        await ns.sleep(10000);
    }

    while (true) 
    {
        deployBasicHack(ns, target, maxRam, homeReservedRam);
        await ns.sleep(10000);
    }
}