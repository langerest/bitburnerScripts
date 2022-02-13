/** @param {import("../.").NS} ns */
export async function main(ns) {
    // const upgName = 'Sell for Money';
    // const upgName = 'Improve Gym Training';
    // var upgNames = ['Exchange for Bladeburner Rank', 'Exchange for Bladeburner SP', 'Sell for Money'];
    var upgNames = ['Sell for Money'];
    const upgTarget = '';
    while (true) {
        var avail_upg = upgNames.filter((u) => ns.hacknet.hashCost(u) <= ns.hacknet.hashCapacity());
        if (avail_upg.length == 0) {
            return;
        }
        while (ns.hacknet.numHashes() > ns.hacknet.hashCost(avail_upg[0])) {
            ns.hacknet.spendHashes(avail_upg[0], upgTarget);
        }
        await ns.sleep(1000);
    }
}