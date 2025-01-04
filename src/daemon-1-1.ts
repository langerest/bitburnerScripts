import { NS } from "..";
import { deployBasicHack } from "./deploy-basic-hack.js"
import { rootAll } from "./root-all.js"

/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    const basicHackScript = "basic-hack.ts";
    const purchaseServerScript = "purchase-server.js";
    const nextDaemonScript = "daemon.js";

    while (ns.getServerMaxRam("home") < 32)
    {
        let target = "n00dles";
        let maxRam = 0;
        let homeReservedRam = 8;
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

    ns.scriptKill(basicHackScript, "home");
    ns.scriptKill(purchaseServerScript, "home");
    ns.exec(nextDaemonScript, "home");
}