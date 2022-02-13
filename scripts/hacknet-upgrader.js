/** @param {import("..").NS} ns */
export async function main(ns) {

    const target_time = 5 * 3600;
    const min_gain_cost_ratio = 1.0 / target_time / 2.5e5;

    while (true) {

        const n_nodes = ns.hacknet.numNodes();
        const player = ns.getPlayer();
        var actions = [];
        for (var i = 0; i < n_nodes; i++) {
            const nodestats = ns.hacknet.getNodeStats(i);
            const cores = nodestats.cores;
            const level = nodestats.level;
            const ram = nodestats.ram;
            actions.push({
                func: ns.hacknet.upgradeCore,
                args: [i, 1],
                cost: ns.hacknet.getCoreUpgradeCost(i, 1),
                gain: ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores + 1, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)
            });
            actions.push({
                func: ns.hacknet.upgradeLevel,
                args: [i, 1],
                cost: ns.hacknet.getLevelUpgradeCost(i, 1),
                gain: ns.formulas.hacknetServers.hashGainRate(level + 1, 0, ram, cores, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)
            });
            actions.push({
                func: ns.hacknet.upgradeRam,
                args: [i, 1],
                cost: ns.hacknet.getRamUpgradeCost(i, 1),
                gain: ns.formulas.hacknetServers.hashGainRate(level, 0, ram * 2, cores, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)
            });
        }
        actions.filter((a) => a.cost != Infinity && a.cost != 0);
        if (n_nodes < ns.hacknet.maxNumNodes()) {
            var level = 1;
            var cores = 1;
            var ram = 1;
            var purchasenode = {
                func: ns.hacknet.purchaseNode,
                args: [],
                cost: ns.hacknet.getPurchaseNodeCost(),
                gain: ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)
            };
            var cost = purchasenode.cost;
            var gain = purchasenode.gain;
            var new_cost;
            var new_gain;
            while ((new_gain = ns.formulas.hacknetServers.hashGainRate(level + 1, 0, ram, cores, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)) /
                (new_cost = ns.formulas.hacknetServers.levelUpgradeCost(level, 1, player.hacknet_node_level_cost_mult)) >
                gain / cost && new_cost != Infinity && new_cost != 0) {
                cost += new_cost;
                gain += new_gain;
                level++;
            }
            while ((new_gain = ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores + 1, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)) /
                (new_cost = ns.formulas.hacknetServers.coreUpgradeCost(cores, 1, player.hacknet_node_core_cost_mult)) >
                gain / cost && new_cost != Infinity && new_cost != 0) {
                cost += new_cost;
                gain += new_gain;
                cores++;
            }
            while ((new_gain = ns.formulas.hacknetServers.hashGainRate(level, 0, ram * 2, cores, player.hacknet_node_money_mult) -
                    ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, player.hacknet_node_money_mult)) /
                (new_cost = ns.formulas.hacknetServers.ramUpgradeCost(ram, 1, player.hacknet_node_ram_cost_mult)) >
                gain / cost && new_cost != Infinity && new_cost != 0) {
                cost += new_cost;
                gain += new_gain;
                ram *= 2;
            }
            ns.tprint(`level ${level} ram ${ram} cores ${cores}`);
            purchasenode.gain = gain / cost * purchasenode.cost;
            actions.push(purchasenode);
        }
        actions.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
        ns.tprint(actions[0]);
        if (actions.length == 0 || actions[0].gain / actions[0].cost < min_gain_cost_ratio) {
            ns.tprint(`Upgrade Hacknet completed.`)
            return;
        }
        while (ns.getServerMoneyAvailable('home') < actions[0].cost) {
            await ns.sleep(1000);
        }
        actions[0].func(...actions[0].args);
    }

}