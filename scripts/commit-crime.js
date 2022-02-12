/** @param {import("../.").NS} ns */
export async function main(ns) {
    const crime = 'Mug someone';
    // const crime = 'Homicide';
    while (true) {
        var delay = ns.commitCrime(crime);
        await ns.sleep(delay + 20);
    }
}