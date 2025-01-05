import { NS } from "../..";

export class BatchHackJob
{
    target: string;
    startTime: number;
    report: boolean
    port: number;

    constructor(ns: NS, target: string, startTime: number, report: boolean)
    {
        this.target = target;
        this.startTime = startTime;
        this.report = report;
        this.port = ns.pid;
    }
}