/** @param {NS} ns **/
export async function main(ns) {
	const args = ns.flags([["help", false]]);
	const ram = args._[0];

	if (ram > ns.getPurchasedServerMaxRam()) {
		ns.tprint(`Ram exceeds maximum. Aborting.`);
		return;
	}

	while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
		if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
			var hostname = ns.purchaseServer('pserv', ram);
			ns.tprint(`Succussfully purchased server ${hostname}`);
		}
		else {
			ns.print(`Current money: '${ns.getServerMoneyAvailable("home")}', Money need to buy '${ram}' GB server: ${ns.getPurchasedServerCost(ram)}`);
			await ns.sleep(10000);
		}
	}

	for (const server of ns.getPurchasedServers()) {
		if (ns.getServerMaxRam(server) < ram) {
			while (ns.getServerMoneyAvailable("home") < ns.getPurchasedServerCost(ram)) {
				ns.print(`Current money: '${ns.getServerMoneyAvailable("home")}', Money need to buy '${ram}' GB server: ${ns.getPurchasedServerCost(ram)}`);
				await ns.sleep(10000);
			}
			ns.killall(server);
			ns.deleteServer(server);
			var hostname = ns.purchaseServer('pserv', ram);
			ns.tprint(`Succussfully deleted server '${server}' and purchased new server ${hostname}`);
		}
	}
}