import { NS } from "..";
import { deployBasicHack } from "./deploy-basic-hack.js"
import { rootAll } from "./root-all.js"
import { purchaseServer } from "./purchase-server.js";
import { openedServers } from "./opened-servers.js";

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const basicHackScript = "basic-hack.js";
    const deployBatchHackScript = "deploy-batch-hack.js";
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
                var pid = ns.exec(deployBatchHackScript, "home", 1, "--homeReservedRam", homeReservedRam, "--noKill");
            }
        }
        await ns.asleep(10000);
    }
}