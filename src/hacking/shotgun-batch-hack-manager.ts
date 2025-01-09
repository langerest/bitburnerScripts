import { NS, ScriptArg, AutocompleteData } from "../..";
import { BatchHack } from "./batch-hack-base";
import { getHackTarget } from "/hack-target-calculator";
import { openedServers } from "/opened-servers";

class ShotgunBatchHackManager extends BatchHack.BatchHackBase
{
    static delayInfo: BatchHack.DelayInfo = 
    {
        stepDelay: 5,
        offsetDelay: 100
    };

    homeReservedRam: number;

    constructor(ns: NS, homeReservedRam: number, serverWeakenRate: number = 1.0)
    {
        super(ns, serverWeakenRate);
        this.homeReservedRam = homeReservedRam;
    }

    updateHosts()
    {
        let servers = openedServers(this.ns).concat(["home"]);
        for (let server of servers)
        {
            for (let script of [BatchHack.BatchHackBase.hackScript, BatchHack.BatchHackBase.growScript, BatchHack.BatchHackBase.weakenScript, "hacking/batch-hack-base.js"])
            {
                if (!this.ns.fileExists(script, server))
                {
                    this.ns.scp(script, server, "home");
                }
            }
        }
        this.hosts = new BatchHack.Hosts(this.ns, servers, this.homeReservedRam);
    }

    updateTargetInfo()
    {
        if (this.hosts === null)
        {
            throw new Error("Invalid hosts.");
        }

        let target = getHackTarget(this.ns, this.hosts.getMaxSingleHostRam() / this.jobTypes.hack.cost)[0].server;
        this.targetInfo = new BatchHack.TargetInfo(this.ns, target);
    }

    computeThreads(targetInfo: BatchHack.TargetInfo, hackThreads: number)
    {
        let percentageToSteal = Math.min(this.ns.hackAnalyze(targetInfo.name) * hackThreads, 0.99);

        // calculate amount needed to grow to replace what was stolen and how many grow threads necessary
        let coForGrowth = 1.0 / (1.0 - percentageToSteal);
        let growThreads = Math.ceil(this.ns.growthAnalyze(targetInfo.name, coForGrowth) * 1.05); // * 1.05 to account for potential hacking skill increase

        // calculate each amount of weakening needed to get back to minsec after our hack/grow threads
        let secIncreaseFromGrow = BatchHack.BatchHackBase.threadHardeningForGrow * growThreads;
        let secIncreaseFromHack = BatchHack.BatchHackBase.threadHardeningForHack * hackThreads;
        let weakenForHackThreads = Math.ceil(secIncreaseFromHack / this.threadPotencyForWeaken);
        let weakenForGrowThreads = Math.ceil(secIncreaseFromGrow / this.threadPotencyForWeaken);
        return [growThreads, weakenForHackThreads, weakenForGrowThreads];
    }

    getJobs()
    {
        if (this.hosts === null)
        {
            throw new Error("Invalid hosts.");
        }

        if (this.targetInfo === null)
        {
            throw new Error("Invalid target info.");
        }

        this.jobs = [];
        let batch = 0
        let currentTime = Date.now();
        if (this.targetInfo.security > this.targetInfo.minSecurity) 
        {
            while (true)
            {
                let type: BatchHack.JobType = "weakenForGrow";
                let threads = Math.floor(this.hosts.getMaxSingleHostRam() / this.jobTypes[type].cost);
                if (threads < 1)
                {
                    break;
                }
                
                let job = new BatchHack.Job(this.ns, this.jobTypes[type], this.targetInfo, threads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                this.hosts.assign(job);
                this.jobs.push(job);
                batch ++;
            }
        } 
        else if (this.targetInfo.money < this.targetInfo.maxMoney) 
        {
            let weakenForGrowThreads: number;
            let growThreads = Math.floor(this.hosts.getMaxSingleHostRam() / this.jobTypes.grow.cost);
            while (growThreads > 0)
            {
                let minThreadsNotWorking = growThreads + 1;
                let maxThreadsWorking = 0;
                while (minThreadsNotWorking - maxThreadsWorking > 1)
                {
                    weakenForGrowThreads = Math.ceil(growThreads * BatchHack.BatchHackBase.threadHardeningForGrow / this.threadPotencyForWeaken);
                    let growJob = new BatchHack.Job(this.ns, this.jobTypes["grow"], this.targetInfo, growThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let weakenForGrowJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForGrow"], this.targetInfo, weakenForGrowThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let tempHosts = this.hosts.deepCopy(this.ns);
                    let canAssign = true;
                    for (let job of [growJob, weakenForGrowJob])
                    {
                        if (!tempHosts.assign(job))
                        {
                            canAssign = false;
                            break;
                        }
                    }

                    if (canAssign) 
                    {
                        maxThreadsWorking = growThreads;
                    }
                    else
                    {
                        minThreadsNotWorking = growThreads;
                    }

                    growThreads = Math.max(Math.floor((maxThreadsWorking + minThreadsNotWorking) / 2), maxThreadsWorking + 1);
                }

                growThreads = maxThreadsWorking;
                if (growThreads < 1)
                {
                    break;
                }

                weakenForGrowThreads = Math.ceil(growThreads * BatchHack.BatchHackBase.threadHardeningForGrow / this.threadPotencyForWeaken);
                let growJob = new BatchHack.Job(this.ns, this.jobTypes["grow"], this.targetInfo, growThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let weakenForGrowJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForGrow"], this.targetInfo, weakenForGrowThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);

                for (let job of [growJob, weakenForGrowJob])
                {
                    this.hosts.assign(job);
                    this.jobs.push(job);
                }

                batch ++;
            }
        } 
        else 
        {
            let growThreads: number;
            let weakenForHackThreads: number;
            let weakenForGrowThreads: number;
            let percentageToSteal = 0.5;
            // calculate amount to steal and number of hack threads necessary
            let amountToSteal = this.targetInfo.maxMoney * percentageToSteal;
            let hackThreads = Math.max(Math.round(this.ns.hackAnalyzeThreads(this.targetInfo.name, amountToSteal)), 1);
            hackThreads = Math.min(hackThreads, Math.floor(this.hosts.getMaxSingleHostRam() / this.jobTypes.hack.cost));
            while (hackThreads > 0)
            {
                let minThreadsNotWorking = hackThreads + 1;
                let maxThreadsWorking = 0;
                while (minThreadsNotWorking - maxThreadsWorking > 1)
                {
                    [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreads(this.targetInfo, hackThreads);

                    let weakenForHackJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForHack"], this.targetInfo, weakenForHackThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let weakenForGrowJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForGrow"], this.targetInfo, weakenForGrowThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let growJob = new BatchHack.Job(this.ns, this.jobTypes["grow"], this.targetInfo, growThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let hackJob = new BatchHack.Job(this.ns, this.jobTypes["hack"], this.targetInfo, hackThreads, currentTime, ShotgunBatchHackManager.delayInfo);
                    let tempHosts = this.hosts.deepCopy(this.ns);
                    let canAssign = true;
                    for (let job of [growJob, hackJob, weakenForGrowJob, weakenForHackJob])
                    {
                        if (!tempHosts.assign(job))
                        {
                            canAssign = false;
                            break;
                        }
                    }
                    if (canAssign) 
                    {
                        maxThreadsWorking = hackThreads;
                    }
                    else
                    {
                        minThreadsNotWorking = hackThreads;
                    }
    
                    hackThreads = Math.max(Math.floor((maxThreadsWorking + minThreadsNotWorking) / 2), maxThreadsWorking + 1);
                }
    
                hackThreads = maxThreadsWorking;
                if (hackThreads < 1)
                {
                    break;
                }
    
                [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreads(this.targetInfo, hackThreads);
                let weakenForHackJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForHack"], this.targetInfo, weakenForHackThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let weakenForGrowJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForGrow"], this.targetInfo, weakenForGrowThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let growJob = new BatchHack.Job(this.ns, this.jobTypes["grow"], this.targetInfo, growThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let hackJob = new BatchHack.Job(this.ns, this.jobTypes["hack"], this.targetInfo, hackThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                for (let job of [hackJob, weakenForHackJob, growJob, weakenForGrowJob])
                {
                    this.hosts.assign(job);
                    this.jobs.push(job);
                }

                batch ++;
            }
        }

        this.targetInfo.delay += Date.now() - currentTime;
    }

    async execute()
    {
        while (true)
        {
            this.updateHosts();
            this.updateTargetInfo();
            this.getJobs();
            await this.deploy();
        }
    }
}

const argSchema = 
[
    ['homeReservedRam', 0],
    ['serverWeakenRate', 1]
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg[]) 
{
    data.flags(argSchema);
    return data.servers;
}

/** @param {import("../..").NS} ns */
export async function main(ns: NS) 
{
    const args = ns.flags(argSchema);
    const reservedRam = args['homeReservedRam'] as number;
    const serverWeakenRate = args['serverWeakenRate'] as number;

	ns.disableLog('sleep');

    let manager = new ShotgunBatchHackManager(ns, reservedRam, serverWeakenRate);
    await manager.execute();
}