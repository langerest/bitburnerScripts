import { AutocompleteData, NS, ScriptArg } from "..";

const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

export function hasTor(ns: NS)
{
    return ns.scan("home").includes("darkweb");
}

export function purchaseProgram(ns: NS)
{   
    if (!hasTor(ns) && !ns.singularity.purchaseTor())
    {
        return;
    }

    for (let program of programs)
    {
        if (ns.fileExists(program, "home"))
        {
            continue;
        }

        if (ns.singularity.purchaseProgram(program))
        {
            ns.tprint(`Purchased ${program}.`);
        }
    }
}

const argSchema = 
[
    ["keepRunning", true]
] as [string, ScriptArg | string[]][];

export function autocomplete(data: AutocompleteData, args: ScriptArg) 
{
    data.flags(argSchema);
    return [];
}

/** @param {import("../.").NS} ns
 * the purpose of the program-manager is to buy all the programs
 * from the darkweb we can afford so we don't have to do it manually
 * or write them ourselves. Like tor-manager, this script dies a natural death
 * once all programs are bought. **/
export async function main(ns: NS) {
    const args = ns.flags(argSchema);
    const keepRunning = args['keepRunning'] as boolean;
    const sleepInterval = 10000;

    do 
    {
        purchaseProgram(ns)
        var foundMissingProgram = programs.filter(program => !ns.fileExists(program, "home")).length == 0;
        if (keepRunning && foundMissingProgram)
        {
            await ns.sleep(sleepInterval);
        }
    } 
    while (keepRunning && foundMissingProgram);
}