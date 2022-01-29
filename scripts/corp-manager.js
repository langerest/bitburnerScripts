const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
const design_city = "Aevum";
const delay = 10000;
const wilson = 'Wilson Analytics';
const division = 'tobacco';
const upgrade_size = 15;
const jobs = ['Operations', 'Engineer', 'Business', 'Management', 'Research & Development'];

/** @param {import("../.").NS} ns */
async function upgrade(ns, cost) {
    while(ns.corporation.getCorporation().funds < cost) {
        await ns.sleep(delay);
    }
    ns.tprint(`Upgrading ${wilson} to level ${ns.corporation.getUpgradeLevel(wilson) + 1}.`);
    ns.corporation.levelUpgrade(wilson);
}

/** @param {import("../.").NS} ns */
async function advert(ns, cost) {
    while(ns.corporation.getCorporation().funds < cost) {
        await ns.sleep(delay);
    }
    ns.tprint(`Hire AdVert in division ${division} to No. ${ns.corporation.getHireAdVertCount(division) + 1}.`);
    ns.corporation.hireAdVert(division);
}

/** @param {import("../.").NS} ns */
async function upgradeOffice(ns, cost) {
    for (const city of cities) {
        while(ns.corporation.getCorporation().funds < ns.corporation.getOfficeSizeUpgradeCost(division, city, upgrade_size)) {
            await ns.sleep(delay);
        }
        ns.tprint(`Upgrade office size in ${city} of division ${division}.`)
        ns.corporation.upgradeOfficeSize(division, city, upgrade_size);
        for (var i = 0; i < upgrade_size; i++) {
            ns.corporation.hireEmployee(division, city);
        }
        const job_count = Math.floor(ns.corporation.getOffice(division, city).size / 5);
        for (const job of jobs) {
            await ns.corporation.setAutoJobAssignment(division, city, job, job_count);
        }
    }
}

/** @param {import("../.").NS} ns */
export async function main(ns) {
    while(true) {
        var tasks = [
            {
                func: upgrade,
                cost_func: ns.corporation.getUpgradeLevelCost,
                cost_func_args: [wilson],
                cost: 0,
                multi: 0.1
            },
            {
                func: advert,
                cost_func: ns.corporation.getHireAdVertCost,
                cost_func_args: [division],
                cost: 0,
                multi: 1
            },
            {
                func: upgradeOffice,
                cost_func: ns.corporation.getOfficeSizeUpgradeCost,
                cost_func_args: [division, design_city, upgrade_size],
                cost: 0,
                multi: 1
            }
        ];
        for (var task of tasks) {
            task.cost = task.cost_func(...task.cost_func_args);
        }
        tasks = tasks.sort((a, b) => a.cost * a.multi - b.cost * b.multi);
        await tasks[0].func(ns, tasks[0].cost);
    }
}