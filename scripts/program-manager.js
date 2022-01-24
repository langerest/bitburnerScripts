/** @param {import("../.").NS} ns
 * the purpose of the program-manager is to buy all the programs
 * from the darkweb we can afford so we don't have to do it manually
 * or write them ourselves. Like tor-manager, this script dies a natural death
 * once all programs are bought. **/
export async function main(ns) {
    const programNames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
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
                   const succuss = ns.purchaseProgram(prog);
                   if (succuss) {
                    ns.toast(`Purchased ${prog}.`);
                   }
                   else {
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