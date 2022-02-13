import {
    deploy
} from '/scripts/deploy.js'
import {
    list_servers
} from '/scripts/opened-servers.js'
import {
    root
} from '/scripts/root.js'

const argSchema = [
    ['target', 'n00dles'],
    ['max_ram', 0],
    ['home_reserved_ram', 32],
];

export function autocomplete(data, args) {
    data.flags(argSchema);
    return data.servers;
}

/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.flags(argSchema);
    const target = args['target'];
    const max_ram = args['max_ram'];
    const home_reserved_ram = args['home_reserved_ram'];
    const script = "/scripts/basic-hack.js";

    while (!ns.hasRootAccess(target)) {
        await ns.sleep(10000);
    }

    while (true) {

        if (!ns.isRunning(script, 'home', target)) {
            if (ns.scriptRunning(script, 'home')) {
                ns.scriptKill(script, 'home');
            }
            if (max_ram == 0 || ns.getServerMaxRam('home') - home_reserved_ram < max_ram) {
                await deploy(ns, 'home', script, [target], home_reserved_ram);
            }
        }

        var servers = list_servers(ns);
        servers = servers.filter(s => s != 'home' && !s.startsWith('hacknet-node-') && ns.hasRootAccess(s) && (max_ram <= 0 || ns.getServerMaxRam(s) < max_ram));

        for (const server of servers) {
            if (!ns.isRunning(script, server, target)) {
                ns.killall(server);
                await deploy(ns, server, script, [target]);
                await ns.sleep(200);
            }
        }

        await ns.sleep(10000);
    }
}