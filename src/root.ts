import { NS } from "..";

/** @param {import("../.").NS} ns **/
export function root(ns: NS, target: string) 
{
	if (ns.hasRootAccess(target)) 
	{
		return true;
	}

	if (ns.fileExists('BruteSSH.exe')) 
	{
		ns.brutessh(target);
	}

	if (ns.fileExists('FTPCrack.exe')) 
	{
		ns.ftpcrack(target);
	}

	if (ns.fileExists('relaySMTP.exe')) 
	{
		ns.relaysmtp(target);
	}

	if (ns.fileExists('HTTPWorm.exe')) 
	{
		ns.httpworm(target);
	}

	if (ns.fileExists('SQLInject.exe')) 
	{
		ns.sqlinject(target);
	}

	try 
	{
		ns.nuke(target);
		ns.print(`Successfully nuked server ${target}.`);
		return true;
	} 
	catch (exception) 
	{
		ns.print(exception);
		return false;
	}
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
	const args = ns.flags
	(
		[
			["help", false]
		]
	);

	let server = (args._ as string[])[0];
	if (!server || args.help) 
	{
		ns.tprint("This script opens the root access to the server.");
		ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} n00dles`);
		return;
	}
	
	root(ns, server);
}