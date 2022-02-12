import {
    calc_material
} from "/scripts/material-calculator";

const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];

const argSchema = [
    ['division', ''],
    ['warehouse_size', 0],
    ['ratio', 0.6]
];

export function autocomplete(data, args) {
    data.flags(argSchema);
    return [];
}

/** @param {import("../.").NS} ns */
export async function main(ns) {
    const args = ns.flags(argSchema);
    const division_name = args['division'];
    const division_type = ns.corporation.getDivision(division_name).type;
    const warehouse_size = args['warehouse_size'];
    const ratio = args['ratio'];

    const delay = 10000;
    const buy_delay = 90;

    const material_target = calc_material(ns, Math.floor(warehouse_size * ratio), division_type);

    const materials = ['Real Estate', 'Hardware', 'Robots', 'AI Cores'];

    for (const city of cities) {
        if (!ns.corporation.hasWarehouse(division_name, city)) {
            while (ns.corporation.getCorporation().funds < ns.corporation.getPurchaseWarehouseCost()) {
                await ns.sleep(delay);
            }
            ns.tprint(`Buying warehouse for division ${division_name} in ${city}.`);
            ns.corporation.purchaseWarehouse(division_name, city);
        }
        var warehouse = ns.corporation.getWarehouse(division_name, city);
        while (warehouse.size < warehouse_size) {
            while (ns.corporation.getCorporation().funds < ns.corporation.getUpgradeWarehouseCost(division_name, city)) {
                await ns.sleep(delay);
            }
            ns.tprint(`Upgrading warehouse for division ${division_name} in ${city}.`);
            ns.corporation.upgradeWarehouse(division_name, city);
            warehouse = ns.corporation.getWarehouse(division_name, city);
        }
        for (const material of materials) {
            var qty = ns.corporation.getMaterial(division_name, city, material).qty;
            var target = material_target[material].amount;
            while (qty < target) {
                const buy_amount = target - qty;
                ns.tprint(`Buying ${buy_amount} ${material} for division ${division_name} in ${city}.`);
                ns.corporation.buyMaterial(division_name, city, material, buy_amount / 10);
                await ns.sleep(buy_delay);
                qty = ns.corporation.getMaterial(division_name, city, material).qty;
            }
            ns.corporation.buyMaterial(division_name, city, material, 0);
        }
    }
}