/** @param {NS} ns **/
export async function main(ns) {
	const root_all = '/scripts/root-all.js';
	const deploy = '/scripts/deploy-hack.js';
	const deploy_share = '/scripts/deploy-share.js';
	const batch = '/scripts/deploy-batch-hack.js';
	const purchase_server = '/scripts/purchase-server.js';
	const tor_manager = '/scripts/tor-manager.js';
	const program_manager = 'scripts/program_manager.js';
	const ram1 = 64;
	const ram2 = 512;
	const min_batch_ram = 64;

	ns.tprint(`Root all servers.`);
	ns.run(root_all, 1);
	var target = 'n00dles';
	ns.tprint(`Deploying hacking script targeting '${target}'.`);
	ns.run(deploy, 1, target);
	//ns.exec(tor_manager, 'home', 1, '-c');
	//ns.exec(program_manager, 'home', 1, '-c');
	ns.tprint(`Purchasing servers ${ram1} GB.`);
	var purchase_pid = ns.run(purchase_server, 1, ram1);

	//var batch_target = 'joesguns';
	//var batch_target = 'harakiri-sushi';
	while (ns.getHackingLevel() < 10) {
		await ns.sleep(60000);
	}
	ns.tprint(`Deploying batch hacking script`);
	var batch_max_time = 90000;
	ns.scriptKill(deploy, 'home');
	ns.run(deploy, 1, target, ram1>=min_batch_ram?ram1:min_batch_ram);
	var batch_pid = ns.run(batch, 1, '--min_ram', ram1>=min_batch_ram?ram1:min_batch_ram, '--max_time', batch_max_time, '--no_kill');
	while ( ns.isRunning(purchase_pid)) {
		if (!ns.isRunning(batch_pid)) {
			batch_pid = ns.run(batch, 1, '--min_ram', ram1>=min_batch_ram?ram1:min_batch_ram, '--max_time', batch_max_time, '--no_kill');
		}
		await ns.sleep(10000);
	}

	ns.tprint(`Deploying batch hacking script`);
	batch_max_time = 180000;
	ns.scriptKill(batch, 'home');
	ns.run(batch, 1, '--min_ram', ram1>=min_batch_ram?ram1:min_batch_ram, '--max_time', batch_max_time);

	var extra_money_to_save = 0;
	//var extra_money_to_save = 1.0e11; 
	while (ns.getServerMoneyAvailable('home') < ns.getPurchasedServerCost(ram2) * 25 + extra_money_to_save) {
		await ns.sleep(60000);
	}

	ns.tprint(`Purchasing servers ${ram2} GB.`);
	purchase_pid = ns.run(purchase_server, 1, ram2);
	while (ns.isRunning(purchase_pid)) {
		await ns.sleep(5000);
	}

	ns.tprint(`Deploying batch hacking script`);
	batch_max_time = 600000;
	ns.scriptKill(batch, 'home');
	ns.run(batch, 1, '--min_ram', ram1>=min_batch_ram?ram1:min_batch_ram, '--max_time', batch_max_time);
	ns.scriptKill(deploy, 'home');
	ns.run(deploy_share, 1, ram1>=min_batch_ram?ram1:min_batch_ram);
	
	// //batch_target = 'joesguns';
	// //batch_target = 'harakiri-sushi';
	// batch_target = 'zer0';
	// //batch_target = 'phantasy';
	// //batch_target = 'omega-net';
	// while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(batch_target) || !ns.hasRootAccess(batch_target)) {
	// 	await ns.sleep(60000);
	// }
	// ns.tprint(`Deploying batch hacking script targeting '${batch_target}'.`);
	// ns.scriptKill(deploy, 'home');
	// ns.run(deploy, 1, target, ram1>=128?ram1:128);
	// ns.scriptKill(batch, 'home');
	// ns.run(batch, 1, batch_target, ram1>=128?ram1:128);

	// while (ns.getServerMoneyAvailable('home') < ns.getPurchasedServerCost(ram2) * 25) {
	// 	await ns.sleep(60000);
	// }
	
	// //batch_target = 'harakiri-sushi';
	// //batch_target = 'zer0';
	// batch_target = 'phantasy';
	// //batch_target = 'omega-net';
	// //batch_target = 'the-hub';
	// //batch_target = 'alpha-ent';
	// //batch_target = '4sigma';
	// while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(batch_target) || !ns.hasRootAccess(batch_target)) {
	// 	await ns.sleep(60000);
	// }
	// ns.tprint(`Purchasing servers ${ram2} GB.`);
	// pid = ns.run(purchase_server, 1, ram2);
	// while (ns.isRunning(pid)) {
	// 	await ns.sleep(5000);
	// }
	// ns.tprint(`Deploying batch hacking script targeting '${batch_target}'.`);
	// ns.scriptKill(batch, 'home');
	// ns.run(batch, 1, batch_target, ram2);
	// ns.scriptKill(deploy, 'home');
	// ns.run(deploy_share, 1, ram1>=128?ram1:128);

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