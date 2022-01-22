/** @param {NS} ns **/
export async function main(ns) {
	var multipiers = ns.getBitNodeMultipliers();
	for (const key in multipiers) {
		ns.tprint(`${key}: ${multipiers[key]}`);
	}
}