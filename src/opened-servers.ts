import { NS } from "..";

/** @param {import("../.").NS} ns **/
function scan(ns: NS, parent: string, server: string, list: string[]) 
{
    const children = ns.scan(server);
    for (let child of children) 
    {
        if (parent == child) 
        {
            continue;
        }

        list.push(child);
        scan(ns, server, child, list);
    }
}

/** @param {import("../.").NS} ns 
 * Lists all server names.
*/
export function listServers(ns: NS)
{
    const list: string[] = [];
    scan(ns, '', 'home', list);
    return list;
}

/** @param {import("../.").NS} ns 
 * Lists the names of all servers on which you can run scripts excluding home.
*/
export function openedServers(ns: NS)
{
    return listServers(ns).filter(server => ns.hasRootAccess(server));
}

/** @param {import("../.").NS} ns */
export function main(ns: NS) 
{
    const args = ns.flags
    (
        [
            ["help", false]
        ]
    );

    if (args.help) 
    {
        ns.tprint("This script lists the names of all servers on which you can run scripts.");
        ns.tprint(`Usage: run ${ns.getScriptName()}`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()}`);
        return;
    }

    const servers = openedServers(ns).concat(['home']);
    for (const server of servers) 
    {
        const used = ns.getServerUsedRam(server);
        const max = ns.getServerMaxRam(server);
        ns.tprint(`${server} is opened. ${used} GB / ${max} GB (${(100 * used / max).toFixed(2)}%)`)
    }
}