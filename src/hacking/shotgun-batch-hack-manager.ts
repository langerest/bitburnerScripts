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

    computeThreadsFromHack(targetInfo: BatchHack.TargetInfo, hackThreads: number): [number, number, number]
    {
        let percentageToSteal = Math.min(this.ns.hackAnalyze(targetInfo.name) * hackThreads, 0.99);

        // calculate amount needed to grow to replace what was stolen and how many grow threads necessary
        let coForGrowth = 1.0 / (1.0 - percentageToSteal);
        let growThreads = Math.ceil(this.ns.growthAnalyze(targetInfo.name, coForGrowth) * 1.05); // * 1.05 to account for potential hacking skill increase

        // calculate each amount of weakening needed to get back to minsec after our hack/grow threads
        let weakenForHackThreads = Math.ceil(hackThreads * BatchHack.BatchHackBase.threadHardeningForHack / this.threadPotencyForWeaken);
        let weakenForGrowThreads = Math.ceil(growThreads * BatchHack.BatchHackBase.threadHardeningForGrow / this.threadPotencyForWeaken);
        return [growThreads, weakenForHackThreads, weakenForGrowThreads];
    }

    computThreadsFromGrow(growThreads: number)
    {
        let weakenForGrowThreads = Math.ceil(growThreads * BatchHack.BatchHackBase.threadHardeningForGrow / this.threadPotencyForWeaken);
        return weakenForGrowThreads;
    }

    binarySearch(scoreFunction: (arg: number) => number, min: number, max: number, minScore: number | null = null, maxScore: number | null = null): [number, number]
    {
        if (min > max)
        {
            throw Error(`Binary search error. Minimum ${min} is greater than Maximum ${max}.`);
        }
        
        minScore = minScore ?? scoreFunction(min);
        if (minScore == 0)
        {
            return [min, minScore];
        }

        if (min == max)
        {
            return [min, minScore];
        }

        maxScore = maxScore ?? scoreFunction(max);
        if (max - min == 1)
        {
            return minScore > maxScore ? [min, minScore] : [max, maxScore];
        }

        let mid = Math.floor((min + max) / 2);
        let midScore = scoreFunction(mid);

        if (minScore > midScore && midScore >= maxScore)
        {
            return this.binarySearch(scoreFunction, min, mid, minScore, midScore);
        }

        if (maxScore > midScore && midScore >= minScore)
        {
            return this.binarySearch(scoreFunction, mid, max, midScore, maxScore);
        }

        [min, minScore] = this.binarySearch(scoreFunction, min, mid, minScore, midScore);
        [max, maxScore] = this.binarySearch(scoreFunction, mid, max, midScore, maxScore);
        return minScore > maxScore ? [min, minScore] : [max, maxScore];
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
                let scoreFunction: (arg: number) => number = (growThreads) =>
                {
                    let weakenForGrowThreads = this.computThreadsFromGrow(growThreads);
                    let growJob = new BatchHack.MockJob(this.jobTypes["grow"], growThreads);
                    let weakenForGrowJob = new BatchHack.MockJob(this.jobTypes["weakenForGrow"], weakenForGrowThreads);
                    return (this.hosts as BatchHack.Hosts).tryAssign(this.ns, [growJob, weakenForGrowJob]) ? growThreads : 0;
                };

                let score = scoreFunction(growThreads);
                if (score == 0)
                {
                    [growThreads, score] = this.binarySearch(scoreFunction, 1, growThreads, null, score);
                }

                if (score == 0)
                {
                    break;
                }

                weakenForGrowThreads = this.computThreadsFromGrow(growThreads);
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
            let percentageToSteal = 0.99;
            // calculate amount to steal and number of hack threads necessary
            let amountToSteal = this.targetInfo.maxMoney * percentageToSteal;
            let hackThreads = Math.max(Math.floor(this.ns.hackAnalyzeThreads(this.targetInfo.name, amountToSteal)), 1);
            hackThreads = Math.min(hackThreads, Math.floor(this.hosts.getMaxSingleHostRam() / this.jobTypes.hack.cost));
            if (hackThreads == 0)
            {
                return;
            }

            let scoreFunction: (arg: number) => number = (hackThreads) =>
            {
                [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreadsFromHack(this.targetInfo as BatchHack.TargetInfo, hackThreads);
                let weakenForHackJob = new BatchHack.MockJob(this.jobTypes["weakenForHack"], weakenForHackThreads);
                let weakenForGrowJob = new BatchHack.MockJob(this.jobTypes["weakenForGrow"], weakenForGrowThreads);
                let growJob = new BatchHack.MockJob(this.jobTypes["grow"], growThreads);
                let hackJob = new BatchHack.MockJob(this.jobTypes["hack"], hackThreads);
                if (!(this.hosts as BatchHack.Hosts).tryAssign(this.ns, [growJob, hackJob, weakenForGrowJob, weakenForHackJob]))
                {
                    return 0;
                }

                let remainingBatch = (this.hosts as BatchHack.Hosts).getTotalRam() / [growJob, hackJob, weakenForGrowJob, weakenForHackJob].map((job) => job.cost).reduce((a, b) => a + b);
                let totalBatch = batch + remainingBatch;
                if (batch == 0)
                {
                    return hackThreads * totalBatch / ((this.targetInfo as BatchHack.TargetInfo).weakenTime + 4 * ShotgunBatchHackManager.delayInfo.stepDelay * totalBatch);
                }

                let score = (previousScore * ((this.targetInfo as BatchHack.TargetInfo).weakenTime + 4 * ShotgunBatchHackManager.delayInfo.stepDelay * batch) + 
                hackThreads * remainingBatch) / ((this.targetInfo as BatchHack.TargetInfo).weakenTime + 4 * ShotgunBatchHackManager.delayInfo.stepDelay * totalBatch);

                return score >= previousScore ? score : 0;
            };

            let score;
            let previousScore = 0;
            [hackThreads, score] = this.binarySearch(scoreFunction, 1, hackThreads);

            if (score == 0)
            {
                return;
            }

            while (true)
            {
                [growThreads, weakenForHackThreads, weakenForGrowThreads] = this.computeThreadsFromHack(this.targetInfo, hackThreads);
                let weakenForHackJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForHack"], this.targetInfo, weakenForHackThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let weakenForGrowJob = new BatchHack.Job(this.ns, this.jobTypes["weakenForGrow"], this.targetInfo, weakenForGrowThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let growJob = new BatchHack.Job(this.ns, this.jobTypes["grow"], this.targetInfo, growThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let hackJob = new BatchHack.Job(this.ns, this.jobTypes["hack"], this.targetInfo, hackThreads, currentTime, ShotgunBatchHackManager.delayInfo, batch);
                let jobs = [hackJob, weakenForHackJob, growJob, weakenForGrowJob];
                if (!this.hosts.tryAssign(this.ns, jobs))
                {
                    previousScore = score;
                    [hackThreads, score] = this.binarySearch(scoreFunction, 1, hackThreads);
                    if (score == 0)
                    {
                        return;
                    }
                }

                for (let job of jobs)
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