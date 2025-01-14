import { NS } from "..";

export function hasTor(ns: NS)
{
    return ns.scan("home").includes("darkweb");
}

export function purchaseProgram(ns: NS)
{
    const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
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

/** @param {import("../.").NS} ns
 * the purpose of the program-manager is to buy all the programs
 * from the darkweb we can afford so we don't have to do it manually
 * or write them ourselves. Like tor-manager, this script dies a natural death
 * once all programs are bought. **/
export async function main(ns: NS) {
    // const programNames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    // const programNames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe"];
    const programNames = ["BruteSSH.exe", "FTPCrack.exe"];
    const interval = 10000;

    const keepRunning = ns.args.length > 0 && ns.args[0] == "-c";
    var foundMissingProgram;
    if (!keepRunning)
        ns.print(`program-manager will run once. Run with argument "-c" to run continuously.`)

    do {
        foundMissingProgram = false;
        for (const prog of programNames) {
            if (!ns.fileExists(prog, 'home')) {
                try {
                    const success = ns.singularity.purchaseProgram(prog);
                    if (success) {
                        ns.toast(`Purchased ${prog}.`);
                    } else {
                        foundMissingProgram = true;
                    }
                } catch (error) {
                    ns.print(error);
                    foundMissingProgram = true;
                }
            }
        }
        if (keepRunning && foundMissingProgram)
            await ns.sleep(interval);
    } while (keepRunning && foundMissingProgram);
}