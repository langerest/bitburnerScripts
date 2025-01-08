import { NS } from "../..";
import { BatchHack } from "./batch-hack-base";

/** @param {import("../..").NS} ns */
export async function main(ns: NS) 
{
    const job = JSON.parse(ns.args[0] as string) as BatchHack.Job;
    let delay = job.startTime - Date.now();
    if (delay < 0)
    {
        ns.tprint(`Batch hack job is ${-delay} ms too late.`);
        ns.writePort(ns.pid, -delay);
        delay = 0
    }
    else
    {
        ns.writePort(ns.pid, 0);
    }
    
    await ns.grow(job.target, { additionalMsec: delay });
    ns.atExit(() => {
            ns.writePort(job.port, JSON.stringify(job));
    });
}