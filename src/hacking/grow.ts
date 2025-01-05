import { NS } from "../..";

/** @param {import("../..").NS} ns */
export async function main(ns: NS) 
{
    const target = ns.args[0] as string;
    var delay: number;
    if (ns.args.length > 1) 
    {
        delay = ns.args[1] as number;
    } 
    else 
    {
        delay = 0;
    }
    
    await ns.grow(target, { additionalMsec: delay });
}