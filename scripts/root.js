/** @param {NS} ns **/
export function root(ns, target) {
	if (ns.hasRootAccess(server)) {
		return;
	}
	if (ns.fileExists('BruteSSH.exe')) {
		ns.brutessh(server);
	}
	if (ns.fileExists('FTPCrack.exe')) {
		ns.ftpcrack(server);
	}
	if (ns.fileExists('relaySMTP.exe')) {
		ns.relaysmtp(server);
	}
	if (ns.fileExists('HTTPWorm.exe')) {
		ns.httpworm(server);
	}
	if (ns.fileExists('SQLInject.exe')) {
		ns.sqlinject(server);
	}
	ns.nuke(server);
}

export async function main(ns) {
	const args = ns.flags([["help", false]]);
    let server = args._[0];
    if (!server || args.help) {
        ns.tprint("This script opens the root access to the server.");
        ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }
	root(ns, server);
}