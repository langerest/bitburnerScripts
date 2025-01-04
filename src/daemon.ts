import { NS } from "..";
import { deployBasicHack } from "./deploy-basic-hack.js"
import { rootAll } from "./root-all.js"

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const basicHackScript = "basic-hack.ts";
    const deployBatchHackScript = "deploy-batch-hack.js";
    const purchaseServerScript = "purchase-server.js";

    while (ns.getServerMaxRam("home") < 32 || ns.isRunning(purchaseServerScript))
    {
        let target = "n00dles";
        let maxRam = 0;
        let homeReservedRam = 32;
        let purchaseServerRam = 32;
        await rootAll(ns);
        if (ns.getServerMaxRam("home") >= 16)
        {
            ns.scriptKill(basicHackScript, "home");
            ns.exec(purchaseServerScript, "home", 1, purchaseServerRam);
        }

        await deployBasicHack(ns, target, maxRam, homeReservedRam);
        await ns.asleep(10000);
    }

    let homeReservedRam = 32;
    ns.scriptKill(basicHackScript, "home");
    var pid = ns.exec(deployBatchHackScript, "home", 1, "--homeReservedRam", homeReservedRam);
    while (ns.isRunning(pid))
    {
        await ns.asleep(10000);
    }

    while (true)
    {
        await rootAll(ns);
        await ns.asleep(10000);
    }
}