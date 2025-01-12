import { NS } from "..";

/** @param {import("../.").NS} ns **/
export async function main(ns: NS) 
{
	while (true) 
	{
		await ns.share();
	}
}