/** @param {import("../.").NS} ns */
export async function main(ns) {
    var crimes = ['Shoplift', 'Rob store', 'Mug someone', 'Larceny', 'Deal Drugs', 'Bond Forgery', 'Traffick illegal Arms',
    'Homicide', 'Grand theft Auto', 'Kidnap and Ransom', 'Assassinate', 'Heist'];
    const priority = 'strength_exp';
    // const priority = 'defense_exp';
    // const priority = 'money';
    const safe_delay = 20;
    // const crime = 'Mug someone';
    // var crimes = ['Homicide'];
    while (true) {
        crimes.sort((a, b) => {
            var a_exp = ns.getCrimeStats(a)[priority];
            var b_exp = ns.getCrimeStats(b)[priority];
            var a_time = ns.getCrimeStats(a).time + safe_delay;
            var b_time = ns.getCrimeStats(b).time + safe_delay;
            return b_exp / b_time * ns.getCrimeChance(b) - a_exp / a_time * ns.getCrimeChance(a);
        })
        var delay = ns.commitCrime(crimes[0]);
        await ns.sleep(delay + safe_delay);
    }
}