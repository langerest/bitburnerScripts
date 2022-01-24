/** @param {NS} ns **/
async function scan(ns, parent, server) {
    const children = ns.scan(server);
	try {
		await ns.installBackdoor();
		ns.tprint(`Installed backdoor on '${server}'.`);
	}
	catch (error) {
		ns.print(error);
	}
    for (let child of children) {
        if (parent == child) {
            continue;
        }
		ns.connect(child);
        await scan(ns, server, child);
    }
	if (parent) {
		ns.connect(parent);
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	while(true){
		await scan(ns, '', 'home');
		await ns.sleep(10000);
	}
}