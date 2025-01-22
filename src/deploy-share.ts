import { AutocompleteData, NS, ScriptArg } from "..";
import { deploy } from "./deploy.js"
import { openedServers } from "./opened-servers.js"

export function deployShare(ns: NS, maxRam: number)
{
    const script = "share.js";
    let servers = openedServers(ns).filter((server) => ns.getServerMaxRam(server) <= maxRam);
    servers.map((server) => 
        {
            if (!ns.isRunning(script, server))
            {
                deploy(ns, server, script, []);
            }
        });
}

const argSchema = 
[
    ["maxRam", 32],
    ["keepRunning", true]
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg) 
{
    data.flags(argSchema);
    return [];
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) {
    const args = ns.flags(argSchema);
    const maxRam = args['maxRam'] as number;
    const keepRunning = args['keepRunning'] as boolean;
    const sleepInterval = 10000;

    do
    {
        deployShare(ns, maxRam);
        if (keepRunning)
        {
            await ns.sleep(sleepInterval);
        }
    }
    while(keepRunning)
}