import { NS, ScriptArg, AutocompleteData } from "..";

/** @param {import("..").NS} ns */
export async function main(ns: NS) 
{
    var target = ns.args[0] as string;
    var moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    var securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    while (true) 
    {
        if (ns.getServerSecurityLevel(target) > securityThresh) 
        {
            await ns.weaken(target);
        } 
        else if (ns.getServerMoneyAvailable(target) < moneyThresh) 
        {
            await ns.grow(target);
        } 
        else 
        {
            await ns.hack(target);
        }
    }
}

export function autocomplete(data: AutocompleteData, args: ScriptArg) 
{
    return data.servers;
}