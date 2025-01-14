import { AutocompleteData, NS, ScriptArg } from "../..";

const factions = ["Illuminati", "Daedalus", "The Covenant", "ECorp", "MegaCorp", "Bachman & Associates", "Blade Industries", "NWO", "Clarke Incorporated", "OmniTek Incorporated",
    "Four Sigma", "KuaiGong International", "Fulcrum Secret Technologies", "BitRunners", "The Black Hand", "NiteSec", "Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12",
    "Volhaven", "Speakers for the Dead", "The Dark Army", "The Syndicate", "Silhouette", "Tetrads", "Slum Snakes", "Netburners", "Tian Di Hui", "CyberSec", "Bladeburners"
];

const manualJoin = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];

export function joinFaction(ns: NS)
{
    let factionInvites = ns.singularity.checkFactionInvitations();
    factionInvites = factionInvites.filter(faction => !manualJoin.includes(faction));
    for (const faction of factionInvites) 
    {
        ns.singularity.joinFaction(faction);
    }
}

export function autocomplete(data: AutocompleteData, args: ScriptArg) {
    return factions;
}

/** @param {import("../..").NS} ns */
export async function main(ns: NS) {
    const faction_to_work = ns.args[0];
    var delay = 60000;
    const focus = false;
    const work_type = 'Hacking Contracts';
    const university = 'rothman university';
    const university_city = 'Sector-12';
    const course_name = 'Study Computer Science';
    const class_name = 'studying Computer Science';
    while (true) {
        joinFaction(ns);
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