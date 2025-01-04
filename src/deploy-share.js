import { deploy } from './deploy.js'
import { listServers } from './opened-servers.js'
import { root } from './root.js'

/** @param {import("../.").NS} ns */
export async function main(ns) {
    const script = "share.js";
    const home_reserved_mem = 50;
    var max_ram = 0;
    if (ns.args.length > 0) {
        max_ram = ns.args[0];
    }

    while (true) {
        var servers = listServers(ns);
        var opened_servers = [];
        var num_port_program = ns.fileExists('BruteSSH.exe') + ns.fileExists('FTPCrack.exe') + ns.fileExists('relaySMTP.exe') + ns.fileExists('HTTPWorm.exe') + ns.fileExists('SQLInject.exe');

        for (const server of servers) {
            if (server == 'home' || server.startsWith('hacknet-node-') || (max_ram > 0 && ns.getServerMaxRam(server) >= max_ram)) {
                continue;
            }
            if (!ns.hasRootAccess(server)) {
                var num_port = ns.getServerNumPortsRequired(server);
                if (num_port <= num_port_program) {
                    root(ns, server);
                    opened_servers.push(server);
                }
            } else {
                opened_servers.push(server);
            }
        }

        for (const server of opened_servers) {
            if (!ns.isRunning(script, server)) {
                ns.killall(server);
                await deploy(ns, server, script, []);
                await ns.sleep(200);
            }
        }

        await ns.sleep(10000);
    }
}