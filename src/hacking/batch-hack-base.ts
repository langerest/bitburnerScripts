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
        protected jobTypes: {[key: string]: JobType};
        protected jobs: BatchHack.Job[] = [];
        protected targetInfo: TargetInfo | null = null;

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
    }

    export interface JobType
    {
        type: string;
        script: string;
        cost: number;
        timeMultiplier: number;
        order: number;
    }

    export class Job
    {
        type: string;
        host: string = "";
        target: string;
        threads: number;
        startTime: number;
        report: boolean;
        port: number;

        constructor(ns: NS, type: string, target: string, threads: number, startTime: number, report: boolean)
        {
            this.type = type;
            this.target = target;
            this.threads = threads;
            this.startTime = startTime;
            this.report = report;
            this.port = ns.pid;
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
        
        constructor(ns: NS, target: string)
        {
            this.name = target;
            this.security = ns.getServerSecurityLevel(target);
            this.minSecurity = ns.getServerMinSecurityLevel(target);
            this.money = ns.getServerMoneyAvailable(target);
            this.maxMoney = ns.getServerMaxMoney(target);
            this.weakenTime = ns.getWeakenTime(target);
        }
    }
}