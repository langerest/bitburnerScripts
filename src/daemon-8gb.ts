import { NS } from "..";
import { openedServers } from "./opened-servers";
import { rootAll } from "./root-all.js"

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const batchHackScript = "hacking/shotgun-batch-hack-manager.js";
    const batchHackScrpits = [batchHackScript, "hacking/batch-hack-base.js", "hack-target-calculator.js", "opened-servers.js"];
    const purchaseServerScript = "purchase-server.js";
    const nextDaemonScript = "daemon-early.js";
    let purchaseServerPid = 0;
    let batchHackPid = 0;
    while (ns.getServerMaxRam("home") < 32)
    {
        let homeReservedRam = 32;
        let purchaseServerRam = 32;
        await rootAll(ns);
        if (ns.getServerMaxRam("home") >= 16 && (purchaseServerPid == 0 || !ns.isRunning(purchaseServerPid)))
        {
            purchaseServerPid = ns.exec(purchaseServerScript, "home", 1, purchaseServerRam);
        }

        if (batchHackPid == 0 || !ns.isRunning(batchHackPid))
        {
            let servers = openedServers(ns).concat("home");
            servers = servers.filter((server) => ns.getServerMaxRam(server) - ns.getServerUsedRam(server) >= ns.getScriptRam(batchHackScript));
            if (servers.length > 0)
            {
                let server = servers[0];
                ns.scp(batchHackScrpits, server, "home");
                batchHackPid = ns.exec(batchHackScript, server, {temporary: true}, "--homeReservedRam", homeReservedRam);
            }
        }
        
        await ns.asleep(10000);
    }

    if (purchaseServerPid && ns.isRunning(purchaseServerPid))
    {
        ns.kill(purchaseServerPid);
    }

    if (batchHackPid && ns.isRunning(batchHackPid))
    {
        ns.kill(batchHackPid);
    }

    ns.exec(nextDaemonScript, "home");
}