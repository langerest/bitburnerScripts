import { NS } from "../..";

export namespace BatchHack 
{
    export abstract class BatchHackBase
    {
        //constant, potency of weaken threads
        static threadPotencyForWeakenBase = 0.05;
        // two weaken threads per 10 hack threads
        static threadHardeningForHack = 0.002;
        // four weaken threads per 5 grow threads
        static threadHardeningForGrow = 0.004;

        static hackScript = 'hacking/hack.js';
        static weakenScript = 'hacking/weaken.js';
        static growScript = 'hacking/grow.js';

        protected ns: NS;
        protected threadPotencyForWeaken: number;
        protected jobTypes: Record<JobType, JobTypeInfo>;
        protected jobs: BatchHack.Job[] = [];
        protected targetInfo: TargetInfo | null = null;
        protected hosts: Hosts | null = null;

        constructor(ns: NS, serverWeakenRate: number = 1.0)
        {
            this.ns = ns;
            this.threadPotencyForWeaken = BatchHackBase.threadPotencyForWeakenBase * serverWeakenRate;
            this.jobTypes =
            {
                "hack":
                {
                    type: "hack",
                    script: BatchHackBase.hackScript,
                    cost: ns.getScriptRam(BatchHackBase.hackScript),
                    timeMultiplier: 0.25,
                    order: 0
                },
                "weakenForHack":
                {
                    type: "weakenForHack",
                    script: BatchHackBase.weakenScript,
                    cost: ns.getScriptRam(BatchHackBase.weakenScript),
                    timeMultiplier: 1,
                    order: 1
                },
                "grow":
                {
                    type: "grow",
                    script: BatchHackBase.growScript,
                    cost: ns.getScriptRam(BatchHackBase.growScript),
                    timeMultiplier: 0.8,
                    order: 2
                },
                "weakenForGrow":
                {
                    type: "weakenForGrow",
                    script: BatchHackBase.weakenScript,
                    cost: ns.getScriptRam(BatchHackBase.weakenScript),
                    timeMultiplier: 1,
                    order: 3
                }
            };
        }
        
        async deploy()
        {
            if (this.targetInfo === null)
            {
                throw new Error("Invalid target info.");
            }
    
            let port = this.ns.getPortHandle(this.ns.pid);
            port.clear();
            for (let job of this.jobs)
            {
                this.ns.print(`Deploy to ${job.type.type} job to '${job.target.name}' on '${job.host}' using ${job.threads} threads.`);
                let pid = job.start(this.ns);
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
                let job = this.jobs.pop() as BatchHack.Job;
                this.hosts?.release(job);
            }
        }
    }

    export type JobType = "hack" | "grow" | "weakenForHack" | "weakenForGrow";

    export interface JobTypeInfo
    {
        type: JobType;
        script: string;
        cost: number;
        timeMultiplier: number;
        order: number;
    }

    export class Job
    {
        type: JobTypeInfo;
        host: string | null = null;
        target: TargetInfo;
        threads: number;
        cost: number;
        startTime: number = 0;
        delayInfo: DelayInfo;
        port: number;
        batch: number;

        constructor(ns: NS, type: JobTypeInfo, target: TargetInfo, threads: number, currentTime: number, delayInfo: DelayInfo, batch = 0)
        {
            this.type = type;
            this.target = target;
            this.threads = threads;
            this.cost = this.threads * this.type.cost;
            this.startTime = currentTime;
            this.delayInfo = delayInfo;
            this.port = ns.pid;
            this.batch = batch;
        }

        updateStartTime()
        {
            this.startTime += this.delayInfo.offsetDelay + this.delayInfo.stepDelay * (this.type.order + 4 * this.batch) + 
                (1 - this.type.timeMultiplier) * this.target.weakenTime + this.target.delay;
        }

        start(ns: NS)
        {
            if (this.host === null)
            {
                throw Error (`Job ${JSON.stringify(this)} not assigned.`);
            }

            this.updateStartTime();
            return ns.exec(this.type.script, this.host, {threads: this.threads, temporary: true}, JSON.stringify(this));
        }
    }

    export class TargetInfo
    {
        name: string;
        security: number;
        minSecurity: number;
        money: number;
        maxMoney: number;
        weakenTime: number;
        delay: number;
        
        constructor(ns: NS, target: string)
        {
            this.name = target;
            this.security = ns.getServerSecurityLevel(target);
            this.minSecurity = ns.getServerMinSecurityLevel(target);
            this.money = ns.getServerMoneyAvailable(target);
            this.maxMoney = ns.getServerMaxMoney(target);
            this.weakenTime = ns.getWeakenTime(target);
            this.delay = 0;
        }
    }

    export interface DelayInfo
    {
        stepDelay: number,
        offsetDelay: number
    }

    interface HostInfo
    {
        name: string,
        ram: number
    }

    export class Hosts
    {
        private _index: Map<string, number> = new Map();
        hostsInfo: HostInfo[] = [];

        constructor(ns: NS, servers: string[], homeReservedRam: number = 0)
        {
            for (let server of servers)
            {
                this.hostsInfo.push(
                    {
                        name: server,
                        ram: ns.getServerMaxRam(server) - Math.max(ns.getServerUsedRam(server), (server == "home" ? homeReservedRam : 0))
                    });
            }

            this._sort();
            this.hostsInfo.forEach((ram, index) => this._index.set(ram.name, index));
        }

        private _sort()
        {
            this.hostsInfo.sort((a, b) => a.ram - b.ram);
        }

        getHost(server: string)
        {
            if (this._index.has(server))
            {
                return this.hostsInfo[this._index.get(server) as number];
            }

            throw new Error(`Server ${server} not found.`);
        }

        getMaxSingleHostRam()
        {
            if (this.hostsInfo.length == 0)
            {
                return 0;
            }

            return this.hostsInfo[this.hostsInfo.length - 1].ram;
        }

        assign(job: Job)
        {
            let host = this.hostsInfo.find((host) => host.ram >= job.cost);
            if (host)
            {
                job.host = host.name;
                host.ram -= job.cost;
                this._sort();
                return true;
            }

            return false;
        }

        release(job: Job)
        {
            if (job.host === null)
            {
                return;
            }

            this.getHost(job.host).ram += job.cost;
            this._sort();
        }
    }
}