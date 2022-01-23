import { deploy } from '/scripts/deploy.js'
import { list_servers } from '/scripts/opened-servers.js'
import {root} from '/scripts/root.js'

/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    ns.tprint(`target: ${target}`);
    const script = "/scripts/basic-hack.js";
    const home_reserved_mem = 128;
    var max_ram = 0;
    if (ns.args.length > 1) {
        max_ram = ns.args[1];
    }

    if (!ns.hasRootAccess(target)) {
        root(ns, target);
    }

    if (!ns.isRunning(script, 'home', target)) {
        if(ns.scriptRunning(script, 'home')) {
            ns.scriptKill(script, 'home');
        }
        if(max_ram == 0 || ns.getServerMaxRam('home') - home_reserved_mem >= max_ram) {
            await deploy(ns, 'home', script, [target], home_reserved_mem);
            await ns.sleep(200);
        }
    }

    while (true) {
        var servers = list_servers(ns);
        var opened_servers = [];
        var num_port_program = ns.fileExists('BruteSSH.exe') + ns.fileExists('FTPCrack.exe') + ns.fileExists('relaySMTP.exe') + ns.fileExists('HTTPWorm.exe') + ns.fileExists('SQLInject.exe');

        for (const server of servers) {
            if (server == 'home' || (max_ram > 0 && ns.getServerMaxRam(server) >= max_ram)) {
                continue;
            }
            if (!ns.hasRootAccess(server)) {
                var num_port = ns.getServerNumPortsRequired(server);
                if (num_port <= num_port_program) {
                    root(ns, server);
                    opened_servers.push(server);
                }
            }
            else {
                opened_servers.push(server);
            }
        }

        for (const server of opened_servers) {
            if (!ns.isRunning(script, server, target)) {
                ns.killall(server);
                await deploy(ns, server, script, [target]);
                await ns.sleep(200);
            }
        }

        await ns.sleep(10000);
    }
}

export function autocomplete(data, args) {
    return data.servers;
}