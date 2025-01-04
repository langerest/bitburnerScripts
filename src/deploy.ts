import { NS, ScriptArg } from "..";

/** @param {import("../.").NS} ns */
export async function deploy(ns: NS, host: string, script: string, scriptArgs: ScriptArg[], reservedRam: number = 0) 
{
	if (!ns.serverExists(host)) 
	{
		ns.tprint(`Server '${host}' does not exist. Aborting.`);
		return 0;
	}

	if (!ns.ls(ns.getHostname()).find(f => f === script)) 
	{
		ns.tprint(`Script '${script}' does not exist. Aborting.`);
		return 0;
	}

	const threads = Math.floor((ns.getServerMaxRam(host) - Math.max(ns.getServerUsedRam(host), reservedRam)) / ns.getScriptRam(script));
	if (threads <= 0) 
	{
		ns.print(`Not enough memory on server '${host}'. Aborting.`);
		return 0;
	}

	ns.tprint(`Launching script '${script}' on server '${host}' with ${threads} threads and the following arguments: ${scriptArgs}`);
	ns.scp(script, host, ns.getHostname());
	ns.exec(script, host, threads, ...scriptArgs);
	return threads;
}

/** @param {import("../.").NS} ns */
export async function main(ns: NS) 
{
	const args = ns.flags(
		[
			["help", false]
		]
	);
	
	if (args.help || (args._ as ScriptArg[]).length < 2) 
	{
		ns.tprint("This script deploys another script on a server with maximum threads possible.");
		ns.tprint(`Usage: run ${ns.getScriptName()} HOST SCRIPT ARGUMENTS`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} n00dles basic-hack.js foodnstuff`);
		return;
	}

	const host = (args._ as string[])[0];
	const script = (args._ as string[])[1];
	const scriptArgs = (args._ as ScriptArg[]).slice(2);

	await deploy(ns, host, script, scriptArgs);
}