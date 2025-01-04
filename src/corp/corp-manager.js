const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
const design_city = "Aevum";
const design_city_extra_size = 60;
const delay = 10000;
const division = 'Tobacco';
const upgrade_size = 15;
const jobs = ['Operations', 'Engineer', 'Business', 'Management', 'Research & Development'];
const upgrades = ['Nuoptimal Nootropic Injector Implants', 'Speech Processor Implants', 'Neural Accelerators', 'FocusWires', 'Project Insight'];

/** @param {import("../.").NS} ns */
async function upgrade(ns, name) {
    ns.tprint(`Upgrading ${name} to level ${ns.corporation.getUpgradeLevel(name) + 1}.`);
    ns.corporation.levelUpgrade(name);
}

/** @param {import("../.").NS} ns */
async function advert(ns) {
    ns.tprint(`Hire AdVert in division ${division} to No. ${ns.corporation.getHireAdVertCount(division) + 1}.`);
    ns.corporation.hireAdVert(division);
}

/** @param {import("../.").NS} ns */
async function upgradeOffice(ns, city) {
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

/** @param {import("../.").NS} ns */
export async function main(ns) {
    while (true) {
        var tasks = [{
                func: upgrade,
                func_args: ['Wilson Analytics'],
                cost_func: ns.corporation.getUpgradeLevelCost,
                cost_func_args: ['Wilson Analytics'],
                cost: 0,
                weight: 0.1
            },
            {
                func: upgrade,
                func_args: ['Project Insight'],
                cost_func: ns.corporation.getUpgradeLevelCost,
                cost_func_args: ['Project Insight'],
                cost: 0,
                weight: 5
            },
            {
                func: advert,
                func_args: [],
                cost_func: ns.corporation.getHireAdVertCost,
                cost_func_args: [division],
                cost: 0,
                weight: 1
            }
        ];
        for (const upg of upgrades) {
            tasks.push({
                func: upgrade,
                func_args: [upg],
                cost_func: ns.corporation.getUpgradeLevelCost,
                cost_func_args: [upg],
                cost: 0,
                weight: 20
            });
        }
        var cities_to_upgrade = cities.sort((a, b) => {
            function get_size(city) {
                var size = ns.corporation.getOffice(division, city).size;
                return city == design_city ? size - design_city_extra_size : size;
            }
            return get_size(a) - get_size(b);
        })
        tasks.push({
            func: upgradeOffice,
            func_args: [cities_to_upgrade[0]],
            cost_func: ns.corporation.getOfficeSizeUpgradeCost,
            cost_func_args: [division, cities_to_upgrade[0], upgrade_size],
            cost: 0,
            weight: 1
        });
        for (var task of tasks) {
            task.cost = task.cost_func(...task.cost_func_args);
        }
        tasks = tasks.sort((a, b) => a.cost * a.weight - b.cost * b.weight);
        if (ns.corporation.getCorporation().funds >= tasks[0].cost) {
            await tasks[0].func(ns, ...tasks[0].func_args);
        }

        // const product_names = ns.corporation.getDivision().products;
        // var products = [];
        // for (const product_name of product_names) {
        //     const product = ns.corporation.getProduct(division, product_name)
        //     if (product.developmentProgress == 100) {

        //     }
        //     products.push(product);
        // }
        else {
            await ns.sleep(delay);
        }
    }
}