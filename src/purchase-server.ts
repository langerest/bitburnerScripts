import { NS, ScriptArg } from "..";
import { openedServers } from "./opened-servers.js";

export function purchaseServer(ns: NS, minRam: number = 32, minPercentageTotalRam: number = 0.1)
{
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
            ns.tprint(`Maximum allowed amount of servers purchased and all servers are at the maximum allowed ram. Aborting.`);
            return;
        }

        purchasedServers.sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b));
        serverToUpgrade = purchasedServers[0];
        ram = Math.max(ns.getServerMaxRam(serverToUpgrade) * 2, ram);
    }

    let totalRam = openedServers(ns).map(ns.getServerMaxRam).reduce((a, b) => a + b );
    ram = Math.max(ram, totalRam * minPercentageTotalRam);
    ram = Math.pow(2, Math.ceil(Math.log2(ram)));
    let cost = ns.getPurchasedServerCost(ram);
    if (serverToUpgrade !== undefined)
    {
        cost = ns.getPurchasedServerUpgradeCost(serverToUpgrade, ram);
    }

    if (cost > ns.getServerMoneyAvailable("home"))
    {
        ns.print(`Current money: '${ns.getServerMoneyAvailable("home")}', Money need to buy '${ram}' GB server: ${ns.getPurchasedServerCost(ram)}`);
        return;
    }

    if (serverToUpgrade === undefined)
    {
        let hostname = ns.purchaseServer('pserv', ram);
        ns.tprint(`Succussfully purchased server ${hostname} at ${ram} GB`);
        return;
    }

    if (ns.upgradePurchasedServer(serverToUpgrade, ram))
    {
        ns.tprint(`Succussfully upgraded server ${serverToUpgrade} to ${ram} GB`);
        return;
    }

    ns.tprint(`Failed to upgrade server ${serverToUpgrade}`);
}

/** @param {import("../.").NS} ns **/
export async function main(ns: NS) 
{
    const args = ns.flags(
        [
            ["help", false]
        ]
    );

    const ram = (args._ as ScriptArg[])[0] as number;

    if (ram > ns.getPurchasedServerMaxRam()) 
    {
        ns.tprint(`Ram exceeds maximum. Aborting.`);
        return;
    }

    while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) 
    {
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) 
        {
            var hostname = ns.purchaseServer('pserv', ram);
            ns.tprint(`Succussfully purchased server ${hostname}`);
        } 
        else 
        {
            ns.print(`Current money: '${ns.getServerMoneyAvailable("home")}', Money need to buy '${ram}' GB server: ${ns.getPurchasedServerCost(ram)}`);
            await ns.sleep(10000);
        }
    }

    for (const server of ns.getPurchasedServers()) 
    {
        if (ns.getServerMaxRam(server) < ram) 
        {
            while (ns.getServerMoneyAvailable("home") < ns.getPurchasedServerCost(ram)) 
            {
                ns.print(`Current money: '${ns.getServerMoneyAvailable("home")}', Money need to buy '${ram}' GB server: ${ns.getPurchasedServerCost(ram)}`);
                await ns.sleep(10000);
            }
            
            ns.killall(server);
            ns.deleteServer(server);
            var hostname = ns.purchaseServer('pserv', ram);
            ns.tprint(`Succussfully deleted server '${server}' and purchased new server ${hostname}`);
        }
    }
}