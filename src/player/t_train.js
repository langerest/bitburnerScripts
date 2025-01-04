/** @param {import("../.").NS} ns */
export async function main(ns) {
    while(ns.getPlayer().strength < 100) {
        if (ns.getPlayer().className != 'training your strength at a gym') {
            ns.gymWorkout('powerhouse gym', 'strength', true);
        }
        await ns.sleep(1000);
    }
    while(ns.getPlayer().defense < 100) {
        if (ns.getPlayer().className != 'training your defense at a gym') {
            ns.gymWorkout('powerhouse gym', 'defense', true);
        }
        await ns.sleep(1000);
    }
    while(ns.getPlayer().dexterity < 100) {
        if (ns.getPlayer().className != 'training your dexterity at a gym') {
            ns.gymWorkout('powerhouse gym', 'dexterity', true);
        }
        await ns.sleep(1000);
    }
    while(ns.getPlayer().agility < 100) {
        if (ns.getPlayer().className != 'training your agility at a gym') {
            ns.gymWorkout('powerhouse gym', 'agility', true);
        }
        await ns.sleep(1000);
    }
    ns.stopAction();
    ns.bladeburner.joinBladeburnerDivision();
    ns.run('/scripts/bladeburner.js', 1);
}