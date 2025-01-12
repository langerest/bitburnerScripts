import { BitNodeMultipliers, NS } from "..";

/** @param {import("../.").NS} ns **/
export function main(ns: NS) 
{
	const file = '/data/bitnode-multiplier.txt';
	var multipiers = ns.getBitNodeMultipliers();
	for (const key in multipiers) 
	{
		ns.tprint(`${key}: ${multipiers[key as keyof BitNodeMultipliers]}`);
	}

	ns.write(file, JSON.stringify(multipiers), 'w');
}