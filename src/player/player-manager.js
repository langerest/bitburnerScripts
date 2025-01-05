const factions = ["Illuminati", "Daedalus", "The Covenant", "ECorp", "MegaCorp", "Bachman & Associates", "Blade Industries", "NWO", "Clarke Incorporated", "OmniTek Incorporated",
    "Four Sigma", "KuaiGong International", "Fulcrum Secret Technologies", "BitRunners", "The Black Hand", "NiteSec", "Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12",
    "Volhaven", "Speakers for the Dead", "The Dark Army", "The Syndicate", "Silhouette", "Tetrads", "Slum Snakes", "Netburners", "Tian Di Hui", "CyberSec", "Bladeburners"
];

const manualJoin = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];

export function autocomplete(data, args) {
    return factions;
}

/** @param {import("../..").NS} ns */
export async function main(ns) {
    const faction_to_work = ns.args[0];
    var delay = 60000;
    const focus = false;
    const work_type = 'Hacking Contracts';
    const university = 'rothman university';
    const university_city = 'Sector-12';
    const course_name = 'Study Computer Science';
    const class_name = 'studying Computer Science';
    while (true) {
        var faction_invites = ns.checkFactionInvitations();
        faction_invites = faction_invites.filter(f => !manualJoin.includes(f));
        for (const faction of faction_invites) {
            ns.joinFaction(faction);
        }
        // var player = ns.getPlayer();
        // if (player.factions.includes(faction_to_work)) {
        //     if (player.workType != 'Working for Faction' || player.currentWorkFactionName != faction_to_work) {
        //         ns.workForFaction(faction_to_work, work_type, focus);
        //     }
        // } else if (ns.getPlayer().city == university_city) {
        //     if (player.className != class_name) {
        //         ns.universityCourse(university, course_name, focus);
        //     }
        // }
        await ns.sleep(delay)
    }
}