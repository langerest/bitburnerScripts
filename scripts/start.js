/** @param {NS} ns **/
export async function main(ns) {
	const deploy = '/scripts/deploy-hack.js';
	const deploy_share = '/scripts/deploy-share.js';
	const batch = '/scripts/deploy-batch-hack.js';
	const purchase_server = '/scripts/purchase-server.js';
	const tor_manager = '/scripts/tor-manager.js';
	const program_manager = 'scripts/program_manager.js';
	const ram1 = 512;
	const ram2 = 4096;

	var target = 'n00dles';
	ns.tprint(`Deploying hacking script targeting '${target}'.`);
	ns.run(deploy, 1, target);
	//ns.exec(tor_manager, 'home', 1, '-c');
	//ns.exec(program_manager, 'home', 1, '-c');
	ns.tprint(`Purchasing servers ${ram1} GB.`);
	var pid = ns.run(purchase_server, 1, ram1);

	var batch_target = 'joesguns';
	//var batch_target = 'harakiri-sushi';
	while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(batch_target) || !ns.hasRootAccess(batch_target)) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying batch hacking script targeting '${batch_target}'.`);
	ns.scriptKill(deploy, 'home');
	ns.run(deploy, 1, target, ram1>=128?ram1:128);
	var batch_pid = ns.run(batch, 1, batch_target, ram1>=128?ram1:128);
	// while(ns.getPurchasedServers().length < ns.getPurchasedServerLimit() || ns.getServerMoneyAvailable('home') < 3.0e8) {
	// 	await ns.sleep(60000);
	// }
	while ( ns.isRunning(pid)) {
		if (!ns.isRunning(batch_pid)) {
			batch_pid = ns.run(batch, 1, batch_target, ram1>=128?ram1:128);
		}
		await ns.sleep(10000);
	}
	
	batch_target = 'joesguns';
	//batch_target = 'zer0';
	//batch_target = 'phantasy';
	//batch_target = 'omega-net';
	while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(batch_target) || !ns.hasRootAccess(batch_target)) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying batch hacking script targeting '${batch_target}'.`);
	ns.scriptKill(deploy, 'home');
	ns.run(deploy, 1, target, ram1>=128?ram1:128);
	ns.scriptKill(batch, 'home');
	ns.run(batch, 1, batch_target, ram1>=128?ram1:128);

	while (ns.getServerMoneyAvailable('home') < ns.getPurchasedServerCost(ram2) * 25) {
		await ns.sleep(60000);
	}
	
	batch_target = 'harakiri-sushi';
	//batch_target = 'phantasy';
	//batch_target = 'omega-net';
	//batch_target = 'the-hub';
	//batch_target = 'alpha-ent';
	//batch_target = '4sigma';
	while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(batch_target) || !ns.hasRootAccess(batch_target)) {
		await ns.sleep(60000);
	}
	ns.tprint(`Purchasing servers ${ram2} GB.`);
	pid = ns.run(purchase_server, 1, ram2);
	while (ns.isRunning(pid)) {
		await ns.sleep(5000);
	}
	ns.tprint(`Deploying batch hacking script targeting '${batch_target}'.`);
	ns.scriptKill(batch, 'home');
	ns.run(batch, 1, batch_target, ram2);
	ns.scriptKill(deploy, 'home');
	ns.run(deploy_share, 1, ram1>=128?ram1:128);

	// while(ns.getHackingLevel() < 1000 || !ns.serverExists('clarkinc') || !ns.hasRootAccess('clarkinc')) {
	// 	await ns.sleep(60000);
	// }
	// ns.tprint(`Deploying batch hacking script targeting 'clarkinc'.`);
	// ns.scriptKill(deploy, 'home');
	// ns.run(deploy, 1, 'joesguns', batch_ram);
	// ns.run(batch, 1, 'clarkinc');
	// while(ns.getHackingLevel() < 4000 || !ns.serverExists('ecorp') || !ns.hasRootAccess('ecorp') || ns.isRunning(pid)) {
	// 	await ns.sleep(60000);
	// }
	// ns.tprint(`Deploying batch hacking script targeting 'ecorp'.`);
	// ns.scriptKill(batch, 'home');
	// ns.run(batch, 1, 'ecorp');
}