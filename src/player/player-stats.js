/** @param {import("../.").NS} ns */
export async function main(ns) {
	var player = ns.getPlayer();
	for (const key in player) {
		ns.tprint(`${key}: ${player[key]}`);
	}
}