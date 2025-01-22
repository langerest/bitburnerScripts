import { NS } from "..";
import { rootAll } from "./root-all.js"
import { purchaseServer } from "./purchase-server.js";
import { openedServers } from "./opened-servers.js";
import { deployShare } from "./deploy-share";
import { purchaseProgram } from "./program-manager";
import { joinFaction, reset, shouldReset, work } from "./player/player-manager";
import { Module } from "./module";

class Daemon
{
    static script = "daemon.js";
    private scriptTotalRam: number;
    private currentRam: number;
    homeReservedRam: number;
    modules: Module[] = [];

    constructor(ns: NS)
    {
        this.scriptTotalRam = ns.getScriptRam(Daemon.script);
        this.currentRam = 17.8;
        this.homeReservedRam = 128;
        this.modules.push(new UpgradeHomeRamModule(128));
        this.modules.push(new ResetModule());
        this.modules.push(new GeneralModule(rootAll));
        this.modules.push(new GeneralModule(purchaseServer));
        this.modules.push(new GeneralModule(purchaseProgram));
        this.modules.push(new PlayerModule());
        this.modules.push(new BackdoorModule());
        this.modules.push(new ShareModule(64));
        this.modules.push(new HackModule(this.homeReservedRam));
    }

    async runModule(ns: NS, module: Module)
    {
        if (!module.isLoaded)
        {
            if (!module.shouldload(ns, this.currentRam, this.scriptTotalRam))
            {
                return;
            }

            this.currentRam = Math.min(this.currentRam + module.ram, this.scriptTotalRam);
            ns.ramOverride(this.currentRam);
            module.load(ns);
        }

        if (module.shouldExecute(ns))
        {
            await module.execute(ns);
        }
    }

    async execute(ns: NS)
    {
        for (let module of this.modules)
        {
            await this.runModule(ns, module);
        }

        await ns.asleep(10000);
    }
}

class GeneralModule extends Module
{
    onExecute: (ns: NS) => void | Promise <void>

    constructor(onExecute: (ns: NS) => void | Promise <void>)
    {
        const ram = 0;
        super(ram);
        this.onExecute = onExecute;
    }

    shouldExecute(ns: NS): boolean 
    {
        return true;
    }

    async execute(ns: NS)
    {
        await this.onExecute(ns);
    }
}

class UpgradeHomeRamModule extends Module
{
    targetRam: number;

    constructor(targetRam: number)
    {
        const ram = 0;
        super(ram);
        this.targetRam = targetRam;
    }

    shouldExecute(ns: NS): boolean 
    {
        return ns.getServerMaxRam("home") < this.targetRam;
    }

    execute(ns: NS)
    {
        while(ns.singularity.upgradeHomeRam())
        {
        }
    }
}


class ResetModule extends Module
{
    constructor()
    {
        const ram = 64;
        super(ram);
    }

    shouldExecute(ns: NS): boolean 
    {
        return shouldReset(ns);
    }

    execute(ns: NS)
    {
        reset(ns);
    }
}

class PlayerModule extends Module
{
    constructor()
    {
        const ram = 64;
        super(ram);
    }

    shouldExecute(ns: NS): boolean 
    {
        return true;
    }

    execute(ns: NS)
    {
        joinFaction(ns);
        work(ns);
    }
}

class BackdoorModule extends Module
{
    static script = "backdoor.js";
    pid: number = 0;

    constructor()
    {
        const ram = 64;
        super(ram);
    }

    shouldExecute(ns: NS): boolean 
    {
        return !ns.scriptRunning(BackdoorModule.script, "home");
    }

    execute(ns: NS)
    {
        this.pid = ns.exec(BackdoorModule.script, "home", {temporary: true});
    }
}

class ShareModule extends Module
{
    maxRam: number;

    constructor(maxRam: number)
    {
        const ram = 0;
        super(ram);
        this.maxRam = maxRam;
    }

    shouldExecute(ns: NS): boolean 
    {
        let servers = openedServers(ns).concat(["home"]);
        return servers.filter((server) => ns.getServerMaxRam(server) >= ns.getPurchasedServerMaxRam()).length > 0;
    }

    execute(ns: NS)
    {
        deployShare(ns, this.maxRam);
    }
}

class HackModule extends Module
{
    static script = "hacking/shotgun-batch-hack-manager.js";
    pid: number = 0;
    homeReservedRam: number;

    constructor(homeReservedRam: number)
    {
        const ram = 0;
        super(ram);
        this.homeReservedRam = homeReservedRam;
    }

    shouldExecute(ns: NS): boolean 
    {
        return !ns.scriptRunning(HackModule.script, "home");
    }

    execute(ns: NS)
    {
        this.pid = ns.exec(HackModule.script, "home", {temporary: true}, "--homeReservedRam", this.homeReservedRam);
    }
}


/** @param {import("..").NS} ns */
export async function main(ns: NS) {
    ns.disableLog("getServerMaxRam");
    ns.disableLog("scan");
    let daemon = new Daemon(ns);
    while (true)
    {
        await daemon.execute(ns);
    }
}