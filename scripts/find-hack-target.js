import {
    listServers
} from '/scripts/opened-servers.js'
import {
    analyzeServer
} from '/scripts/analyze-server.js'

/** @param {import("../.").NS} ns */
export async function main(ns) {
    var servers = listServers(ns);
    for (const server of servers) {
        if (ns.getServerGrowth(server) < 10 || ns.hackAnalyzeChance(server) <= 0.1 || ns.getServerMaxMoney(server) < 1e7) {
            continue;
        }
        analyzeServer(ns, server);
    }
}