import { AutocompleteData, NS, ScriptArg } from "..";
import { openedServers } from "./opened-servers.js";

export function purchaseServer(ns: NS, minRam: number = 32, minPercentageTotalRam: number = 0.1)
{
    ns.disableLog("getServerMaxRam");
    if (minRam > ns.getPurchasedServerMaxRam())
    {
        ns.tprint(`Minimum ram requested for new server ${minRam} GB exceeds the maximum allowed ram for purchased server ${ns.getPurchasedServerMaxRam()} GB. Aborting`);
        return;
    }

    let purchasedServers = ns.getPurchasedServers();
    let serverToUpgrade: string | undefined;
    let ram = Math.max(minRam, 2);
    if (purchasedServers.length >= ns.getPurchasedServerLimit())
    {
        purchasedServers = purchasedServers.filter(server => ns.getServerMaxRam(server) < ns.getPurchasedServerMaxRam());
        if (!purchasedServers.length)
        {
            ns.print(`Maximum allowed amount of servers purchased and all servers are at the maximum allowed ram. Aborting.`);
            return;
        }

        purchasedServers.sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b));
        serverToUpgrade = purchasedServers[0];
        ram = Math.max(ns.getServerMaxRam(serverToUpgrade) * 2, ram);
    }

    let totalRam = openedServers(ns).map(ns.getServerMaxRam).reduce((a, b) => a + b );
    ram = Math.max(ram, totalRam * minPercentageTotalRam);
    ram = Math.pow(2, Math.ceil(Math.log2(ram)));
    ram = Math.min(ram, ns.getPurchasedServerMaxRam());

    if (serverToUpgrade === undefined)
    {
        let hostname = ns.purchaseServer('pserv', ram);
        if (hostname)
        {
            ns.tprint(`Succussfully purchased server ${hostname} at ${ram} GB`);
        }

        return;
    }

    if (ns.upgradePurchasedServer(serverToUpgrade, ram))
    {
        ns.tprint(`Succussfully upgraded server ${serverToUpgrade} to ${ram} GB`);
    }

    return;
}

const argSchema = 
[
    ["minRam", 32],
    ["minPercentageTotalRam", 0.1],
    ["keepRunning", true]
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg) 
{
    data.flags(argSchema);
    return [];
}

/** @param {import("../.").NS} ns **/
export async function main(ns: NS) 
{
    const args = ns.flags(argSchema);
    const minRam = args['minRam'] as number;
    const minPercentageTotalRam = args['minPercentageTotalRam'] as number;
    const keepRuning = args['keepRuning'] as boolean;
    const sleepInterval = 10000;

    do
    {
        purchaseServer(ns, minRam, minPercentageTotalRam);
        if (keepRuning)
        {
            let purchasedServers = ns.getPurchasedServers();
            if (purchasedServers.filter(server => ns.getServerMaxRam(server) >= ns.getPurchasedServerMaxRam()).length >= ns.getPurchasedServerLimit())
            {
                ns.tprint("Purchasing server complete.");
                return;
            }

            await ns.sleep(sleepInterval);
        }
    }
    while(keepRuning)
}