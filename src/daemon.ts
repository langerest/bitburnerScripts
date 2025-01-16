import { NS } from "..";
import { rootAll } from "./root-all.js"
import { purchaseServer } from "./purchase-server.js";
import { openedServers } from "./opened-servers.js";
import { deployShare } from "./deploy-share";
import { purchaseProgram } from "./program-manager";
import { joinFaction, reset, shouldReset, work } from "./player/player-manager";

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const basicHackScript = "hacking/basic-hack.js";
    const batchHackScript = "hacking/shotgun-batch-hack-manager.js";
    const bitnodeMultiplierScript = "bitnode-multiplier.js";
    const backdoorScript = "backdoor.js";
    ns.disableLog("getServerMaxRam");
    ns.disableLog("scan");
    ns.exec(bitnodeMultiplierScript, "home");

    while (true)
    {
        let homeReservedRam = 128;
        if (shouldReset(ns))
        {
            reset(ns);
        }

        await rootAll(ns);
        purchaseServer(ns);
        purchaseProgram(ns);
        joinFaction(ns);
        work(ns);

        if (!ns.scriptRunning(backdoorScript, "home"))
        {
            ns.exec(backdoorScript, "home", {temporary: true});
        }

        let servers = openedServers(ns).concat(["home"]);
        if (servers.filter((server) => ns.getServerMaxRam(server) >= ns.getPurchasedServerMaxRam()).length > 0)
        {
            deployShare(ns, 64);
        }

        if (!ns.scriptRunning(batchHackScript, "home"))
        {
            servers.map(server => ns.scriptKill(basicHackScript, server));
            var pid = ns.exec(batchHackScript, "home", {temporary: true}, "--homeReservedRam", homeReservedRam);
        }

        await ns.asleep(10000);
    }
}