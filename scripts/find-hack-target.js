import { list_servers } from '/scripts/opened-servers.js' 
import { analyze_server } from '/scripts/analyze-server.js' 

/** @param {NS} ns **/
export async function main(ns) {
	var servers = list_servers(ns);
    for (const server of servers) {
        if (ns.getServerGrowth(server) < 10 || ns.hackAnalyzeChance(server) <= 0.1 || ns.getServerMaxMoney(server) < 1e7) {
            continue;
        }
        analyze_server(ns, server);
    }
}