/** @param {import("../.").NS} ns **/
export async function main(ns) {
	const file = '/data/bitnode_multiplier.txt';
	var multipiers = ns.getBitNodeMultipliers();
	for (const key in multipiers) {
		ns.tprint(`${key}: ${multipiers[key]}`);
	}
	await ns.write(file, JSON.stringify(multipiers), 'w');
}