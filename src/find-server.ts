import { AutocompleteData, NS, ScriptArg } from "..";

/** @param {import("..").NS} ns */
export function recursiveScan(ns: NS, parent: string, server: string, target: string, route: string[]) 
{
    const children = ns.scan(server);
    for (let child of children) 
    {
        if (parent == child) 
        {
            continue;
        }

        if (child == target) 
        {
            route.unshift(child);
            route.unshift(server);
            return true;
        }

        if (recursiveScan(ns, server, child, target, route)) 
        {
            route.unshift(server);
            return true;
        }
    }
    
    return false;
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) {
    const args = ns.flags([
        ["help", false]
    ]);
    let route: string[] = [];
    let server = (args._ as (string[] | ScriptArg)[])[0] as string;
    if (!server || args.help) 
    {
        ns.tprint("This script helps you find a server on the network and shows you the path to get to it.");
        ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }

    recursiveScan(ns, '', 'home', server, route);

    var output = '';
    for (const medium of route) 
    {
        if (medium == 'home') 
        {
            output = output.concat(`home;`);
        } 
        else 
        {
            output = output.concat(`connect ${medium};`);
        }
    }
    ns.tprint(output);
}

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) 
{
    return data.servers;
}