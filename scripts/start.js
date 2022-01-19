/** @param {NS} ns **/
export async function main(ns) {
	const deploy = '/scripts/deploy-hack.js';
	const purchase_server = '/scripts/purchase-server.js';
	const tor_manager = '/scripts/tor-manager.js';
	const program_manager = 'scripts/program_manager.js';
	const ram1 = 256;
	const ram2 = 8192;
	ns.tprint(`Deploying hacking script targeting 'n00dles'.`);
	ns.exec(deploy, 'home', 1, 'n00dles');
	await ns.sleep(1000);
	ns.exec(tor_manager, 'home', 1, '-c');
	ns.exec(program_manager, 'home', 1, '-c');
	ns.tprint(`Purchasing servers ${ram1} GB.`);
	ns.exec(purchase_server, 'home', 1, ram1);
	while(ns.getHackingLevel() < 50) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying hacking script targeting 'joesguns'.`);
	ns.scriptKill(deploy, 'home');
	ns.exec(deploy, 'home', 1, 'joesguns');
	while(ns.getPurchasedServers().length < ns.getPurchasedServerLimit() || ns.getServerMoneyAvailable('home') < 3.0e8) {
		await ns.sleep(60000);
	}

	ns.tprint(`Purchasing servers ${ram2} GB.`);
	ns.exec(purchase_server, 'home', 1, ram2);

	while(ns.getHackingLevel() < 600 || !ns.serverExists('the-hub') || !ns.hasRootAccess('the-hub')) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying hacking script targeting 'the-hub'.`);
	ns.scriptKill(deploy, 'home');
	ns.exec(deploy, 'home', 1, 'the-hub');

	while(ns.getHackingLevel() < 1000 || !ns.serverExists('alpha-ent') || !ns.hasRootAccess('alpha-ent')) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying hacking script targeting 'alpha-ent'.`);
	ns.scriptKill(deploy, 'home');
	ns.exec(deploy, 'home', 1, 'alpha-ent');
}