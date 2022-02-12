/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];
	var delay;
	if (ns.args.length > 1) {
		delay = ns.args[1];
	} else {
		delay = 0;
	}
	await ns.sleep(delay);
	await ns.weaken(target);
}