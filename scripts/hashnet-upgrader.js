/** @param {import("../.").NS} ns */
export async function main(ns) {
    while (true) {

        const n_nodes = ns.hacknet.numNodes();
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
                gain: ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores + 1) - ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores)
            });
            actions.push({
                func: ns.hacknet.upgradeLevel,
                args: [i, 1],
                cost: ns.hacknet.getLevelUpgradeCost(i, 1),
                gain: ns.formulas.hacknetServers.hashGainRate(level + 1, 0, ram, cores) - ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores)
            });
            actions.push({
                func: ns.hacknet.upgradeRam,
                args: [i, 1],
                cost: ns.hacknet.getRamUpgradeCost(i, 1),
                gain: ns.formulas.hacknetServers.hashGainRate(level, 0, ram * 2, cores) - ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores)
            });
        }
        actions.push({
            func: ns.hacknet.purchaseNode,
            args: [],
            cost: ns.hacknet.getPurchaseNodeCost(),
            gain: ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1)
        });
        actions.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
        while (ns.getServerMoneyAvailable('home') < actions[0].cost) {
            while (ns.hacknet.numHashes() > 4) {
                ns.hacknet.spendHashes('Sell for Money');
            }
            await ns.sleep(1000);
        }
        actions[0].func(...actions[0].args);
    }

}