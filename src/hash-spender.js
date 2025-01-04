/** @param {import("../.").NS} ns */
export async function main(ns) {
    const upgfallback = 'Sell for Money';
    const upgName = 'Improve Gym Training';
    const bitnode_multiplier = '/data/bitnode-multiplier.txt';
    var upgrades = [
        // {
        //     name: 'Exchange for Bladeburner Rank',
        //     weight: 1
        // },
        // {
        //     name: 'Exchange for Bladeburner SP',
        //     weight: 0.3 * JSON.parse(ns.read(bitnode_multiplier)).BladeburnerSkillCost
        // },
        // {
        //     name: 'Sell for Corporation Funds',
        //     weight: 1
        // },
        // {
        //     name: 'Exchange for Corporation Research',
        //     weight: 1
        // }
    ];
    // var upgrades = [{
    //     name: 'Improve Gym Training',
    //     weight: 1
    // }];
    // var upgrades = [];
    // if (ns.getPlayer().hasCorporation) {
    //     upgrades.push({
    //         name: 'Sell for Corporation Funds',
    //         weight: 1
    //     })
    // }
    const upgTarget = '';
    while (true) {
        var avail_upg = upgrades.filter((u) => ns.hacknet.hashCost(u.name) <= ns.hacknet.hashCapacity() * u.weight);
        var upg;
        if (avail_upg.length == 0) {
            upg = upgfallback;
        } else {
            avail_upg.sort((a, b) => ns.hacknet.hashCost(a.name) / a.weight - ns.hacknet.hashCost(b.name) / b.weight);
            upg = avail_upg[0].name
        }
        while (ns.hacknet.numHashes() > ns.hacknet.hashCost(upg)) {
            ns.hacknet.spendHashes(upg, upgTarget);
        }
        await ns.sleep(1000);
    }
}