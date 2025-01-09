import { NS } from "..";
import { deployBasicHack } from "./deploy-basic-hack.js"
import { rootAll } from "./root-all.js"
import { purchaseServer } from "./purchase-server.js";
import { openedServers } from "./opened-servers.js";
import { getHackTarget } from "./hack-target-calculator";

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const basicHackScript = "hacking/basic-hack.js";
    const deployBatchHackScript = "hacking/shotgun-batch-hack-manager.js";
    ns.disableLog("getServerMaxRam");
    ns.disableLog("scan");

    while (true)
    {
        let target = "n00dles";
        let maxRam = 0;
        let homeReservedRam = 32;
        await rootAll(ns);
        purchaseServer(ns);
        let servers = openedServers(ns).filter(server => ns.getServerMaxRam(server) >= 32);
        if (servers.length < 5 || ns.getHackingLevel() < 10)
        {
            await deployBasicHack(ns, target, maxRam, homeReservedRam);
        }
        else
        {
            if (!ns.scriptRunning(deployBatchHackScript, "home"))
            {
                ns.scriptKill(basicHackScript, "home");
                target = getHackTarget(ns, 100)[0].server;
                var pid = ns.exec(deployBatchHackScript, "home", {temporary: true}, "--target", target, "--homeReservedRam", homeReservedRam);
            }
        }
        await ns.asleep(10000);
    }
}