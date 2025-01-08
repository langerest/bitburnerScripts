import { NS, ScriptArg, AutocompleteData } from "../..";
import { BatchHack } from "./batch-hack-base";

class BatchHackManager extends BatchHack.BatchHackBase
{
    static batchHackManagerScript = 'hacking/batch-hack-manager.js';
    static stepDelay = 5;
    static offsetDelay = 80;
    static delayToPreventFreeze = 20;

    host: string;
    cpuCores: number;
    target: string;
    reservedRam: number;
    scriptRam: number;

    constructor(ns: NS, target: string, reservedRam: number, serverWeakenRate: number = 1.0)
    {
        super(ns, serverWeakenRate);
        this.host = ns.getHostname();
        if (this.host === "home")
        {
            this.cpuCores = ns.getServer(this.host).cpuCores;
        }
        else
        {
            this.cpuCores = 1;
        }

        this.target = target;
        this.reservedRam = reservedRam;
        this.scriptRam = ns.getScriptRam(BatchHackManager.batchHackManagerScript);
    }

    updateTargetInfo()
    {
        this.targetInfo = new BatchHack.TargetInfo(this.ns, this.target);
    }

    getJobStartTime(type: BatchHack.JobType, currentTime: number, targetInfo: BatchHack.TargetInfo)
    {
        return currentTime + BatchHackManager.offsetDelay + BatchHackManager.stepDelay * this.jobTypes[type].order + 
        (1 - this.jobTypes[type].timeMultiplier) * targetInfo.weakenTime;
    }

    computeThreads(targetInfo: BatchHack.TargetInfo, hackThreads: number)
    {
        let percentageToSteal = Math.min(this.ns.hackAnalyze(targetInfo.name) * hackThreads, 0.99);

        // calculate amount needed to grow to replace what was stolen and how many grow threads necessary
        let coForGrowth = 1.0 / (1.0 - percentageToSteal);
        let growThreads = Math.ceil(this.ns.growthAnalyze(targetInfo.name, coForGrowth, this.cpuCores) * 1.05);

        // calculate each amount of weakening needed to get back to minsec after our hack/grow threads
        let secIncreaseFromGrow = BatchHack.BatchHackBase.threadHardeningForGrow * growThreads;
        let secIncreaseFromHack = BatchHack.BatchHackBase.threadHardeningForHack * hackThreads;
        let weakenForHackThreads = Math.ceil(secIncreaseFromHack / this.threadPotencyForWeaken);
        let weakenForGrowThreads = Math.ceil(secIncreaseFromGrow / this.threadPotencyForWeaken);
        return [growThreads, weakenForHackThreads, weakenForGrowThreads];
    }

    getJobs()
    {
        if (this.targetInfo === null)
        {
            throw new Error("Invalid target info.");
        }

        this.jobs = [];
        let availableRam = this.ns.getServerMaxRam(this.host) - Math.max(this.ns.getServerUsedRam(this.host), this.reservedRam + this.scriptRam);
        if (this.targetInfo.security > this.targetInfo.minSecurity) 
        {
            let type: BatchHack.JobType = "weakenForGrow";
            let threads = Math.floor(availableRam / this.jobTypes[type].cost);
            let currentTime = Date.now()
            let job = new BatchHack.Job(this.ns, type, this.targetInfo.name, threads, this.getJobStartTime(type, currentTime, this.targetInfo));
            this.jobs.push(job)
        } 
        else if (this.targetInfo.money < this.targetInfo.maxMoney) 
        {
            let singleCycleCost = this.jobTypes.weakenForGrow.cost + this.jobTypes.grow.cost * this.threadPotencyForWeaken / BatchHack.BatchHackBase.threadHardeningForGrow;
            let cyclesAvailable = availableRam / singleCycleCost;
            let threadsForGrow = Math.max(Math.floor(cyclesAvailable * this.threadPotencyForWeaken / BatchHack.BatchHackBase.threadHardeningForGrow), 1);
            let threadsForWeaken = Math.max(Math.floor((availableRam - this.jobTypes.grow.cost * threadsForGrow) / this.jobTypes.weakenForGrow.cost), 1);
            let currentTime = Date.now()
            let weakenJob = new BatchHack.Job(this.ns, "weakenForGrow", this.targetInfo.name, threadsForWeaken, this.getJobStartTime("weakenForGrow", currentTime, this.targetInfo));
            let growJob = new BatchHack.Job(this.ns, "grow", this.targetInfo.name, threadsForGrow, this.getJobStartTime("grow", currentTime, this.targetInfo));
            this.jobs.push(growJob);
            this.jobs.push(weakenJob);
        } 
        else 
        {
            let hackThreads: number;
            let growThreads: number;
            let weakenForHackThreads: number;
            let weakenForGrowThreads: number;
            let totalHackCost: number;
            let totalGrowCost: number;
            let percentageToSteal = 0.99;
            // calculate amount to steal and number of hack threads necessary
            let amountToSteal = this.targetInfo.maxMoney * percentageToSteal;
            hackThreads = Math.max(Math.floor(this.ns.hackAnalyzeThreads(this.targetInfo.name, amountToSteal)), 1);
            hackThreads = Math.min(hackThreads, Math.floor(availableRam / this.jobTypes.hack.cost));
            let minThreadsNotWorking = hackThreads + 1;
            let maxThreadsWorking = 0;
            while (minThreadsNotWorking - maxThreadsWorking > 1)
            {
                [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreads(this.targetInfo, hackThreads);
                totalHackCost = hackThreads * this.jobTypes.hack.cost;
                totalGrowCost = growThreads * this.jobTypes.grow.cost;
                let totalWeakenCost = (weakenForGrowThreads + weakenForHackThreads) * this.jobTypes.weakenForGrow.cost;

                // calculate how many threads we can run at once
                let totalCycleCost = totalHackCost + totalGrowCost + totalWeakenCost;
                let cycleThreadsAvailable = Math.floor(availableRam / totalCycleCost);
                if (cycleThreadsAvailable >= 1) 
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
                this.ns.tprint(`Ram of '${this.host}' is too small to hack '${this.targetInfo.name}'. Aborting.`);
                return;
            }

            [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreads(this.targetInfo, hackThreads);
            let currentTime = Date.now()
            let weakenForHackJob = new BatchHack.Job(this.ns, "weakenForHack", this.targetInfo.name, weakenForHackThreads, this.getJobStartTime("weakenForHack", currentTime, this.targetInfo));
            let weakenForGrowJob = new BatchHack.Job(this.ns, "weakenForGrow", this.targetInfo.name, weakenForGrowThreads, this.getJobStartTime("weakenForGrow", currentTime, this.targetInfo));
            let growJob = new BatchHack.Job(this.ns, "grow", this.targetInfo.name, growThreads, this.getJobStartTime("grow", currentTime, this.targetInfo));
            let hackJob = new BatchHack.Job(this.ns, "hack", this.targetInfo.name, hackThreads, this.getJobStartTime("hack", currentTime, this.targetInfo));
            this.jobs.push(hackJob);
            this.jobs.push(weakenForHackJob);
            this.jobs.push(growJob);
            this.jobs.push(weakenForGrowJob);
            this.ns.print(`Hack '${this.targetInfo.name}' for ${this.ns.formatPercent(percentageToSteal)}.`);
        }
    }

    async deploy()
    {
        if (this.targetInfo === null)
        {
            throw new Error("Invalid target info.");
        }

        try
        {
            let port = this.ns.getPortHandle(this.ns.pid);
            port.clear();
            for (let job of this.jobs)
            {
                this.ns.print(`Deploy to ${job.type} job to '${job.target}' on '${this.host}' using ${job.threads} threads.`);
                job.startTime += this.targetInfo.delay;
                let pid = this.ns.exec(this.jobTypes[job.type].script, this.host, {threads: job.threads, temporary: true}, JSON.stringify(job));
                await this.ns.nextPortWrite(pid);
                this.targetInfo.delay += this.ns.readPort(pid);
            }

            this.jobs = this.jobs.reverse();
            while (this.jobs.length > 0)
            {
                if (port.empty())
                {
                    await port.nextWrite();
                }

                this.ns.print(`Job finished ${port.read()}`);
                this.jobs.pop();
            }
        }
        catch(error)
        {
            this.ns.print(error);
            await this.ns.asleep(BatchHackManager.delayToPreventFreeze);
        }
    }

    async execute()
    {
        while (true)
        {
            this.updateTargetInfo();
            this.getJobs();
            await this.deploy();
        }
    }
}

const argSchema = 
[
    ['target', ''],
    ['reservedRam', 0],
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
    const target = args['target'] as string;
    const reservedRam = args['reservedRam'] as number;
    const serverWeakenRate = args['serverWeakenRate'] as number;

	ns.disableLog('sleep');

    let manager = new BatchHackManager(ns, target, reservedRam, serverWeakenRate);
    await manager.execute();
}