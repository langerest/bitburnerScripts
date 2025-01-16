import { AutocompleteData, NS, ScriptArg } from "../..";

export const allFactions = ["Illuminati", "Daedalus", "The Covenant", "ECorp", "MegaCorp", "Bachman & Associates", "Blade Industries", "NWO", "Clarke Incorporated", "OmniTek Incorporated",
    "Four Sigma", "KuaiGong International", "Fulcrum Secret Technologies", "BitRunners", "The Black Hand", "NiteSec", "Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12",
    "Volhaven", "Speakers for the Dead", "The Dark Army", "The Syndicate", "Silhouette", "Tetrads", "Slum Snakes", "Netburners", "Tian Di Hui", "CyberSec", "Bladeburners"
];

const manualJoin = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];

export function getUnboughtAugmentations(ns: NS, faction: string)
{
    return ns.singularity.getAugmentationsFromFaction(faction).filter(augmentation => !ns.singularity.getOwnedAugmentations(true).includes(augmentation))
}

export function hasUnboughtAugmentations(ns: NS, faction: string)
{
    return getUnboughtAugmentations(ns, faction).length > 0;
}

export function getMaxAugmentationRepReq(ns: NS, faction: string)
{
    return getUnboughtAugmentations(ns, faction).map(augmentation => ns.singularity.getAugmentationRepReq(augmentation))
        .reduce((a, b) => Math.max(a, b))
}

export function joinFaction(ns: NS)
{
    let factionInvites = ns.singularity.checkFactionInvitations();
    factionInvites = factionInvites.filter(faction => !manualJoin.includes(faction) || 
        hasUnboughtAugmentations(ns, faction));
    for (const faction of factionInvites) 
    {
        ns.singularity.joinFaction(faction);
    }
}

export function work(ns: NS)
{
    let player = ns.getPlayer();
    let factions = player.factions;
    factions = factions.filter(faction => hasUnboughtAugmentations(ns, faction) && 
        ns.singularity.getFactionRep(faction) < getMaxAugmentationRepReq(ns, faction));
    if (factions.length > 0)
    {
        factions = factions.sort((a, b) => ns.singularity.getFactionWorkTypes(a).includes(ns.enums.FactionWorkType.hacking) ? -1 : 
            ns.singularity.getFactionWorkTypes(b).includes(ns.enums.FactionWorkType.hacking) ? 1 : 0);
        let factionToWork = factions[0];
        let workType = ns.singularity.getFactionWorkTypes(factionToWork).includes(ns.enums.FactionWorkType.hacking) ? 
            ns.enums.FactionWorkType.hacking : ns.singularity.getFactionWorkTypes(factionToWork)[0];
        let currentWork = ns.singularity.getCurrentWork();
        if (currentWork === null || currentWork.type != "FACTION" || currentWork.factionName != factionToWork || currentWork.factionWorkType != workType)
        {
            ns.singularity.workForFaction(factionToWork, workType, true);
        }
    }
}

function buyAugmentation(ns: NS, augmentation: string)
{
    if (augmentation != "NeuroFlux Governor" && ns.singularity.getOwnedAugmentations(true).includes(augmentation))
    {
        return true;
    }

    let prereqs = ns.singularity.getAugmentationPrereq(augmentation);
    for (let prereq of prereqs)
    {
        if (!buyAugmentation(ns, prereq))
        {
            return false;
        }
    }

    let factions = ns.singularity.getAugmentationFactions(augmentation).sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a));
    if (factions.length === 0)
    {
        return false;
    }

    return ns.singularity.purchaseAugmentation(factions[0], augmentation);
}

export function shouldReset(ns: NS)
{
    let factions = allFactions.filter(faction => 
        {
            if(!hasUnboughtAugmentations(ns, faction))
            {
                return false;
            }
            
            let maxRepReq = getMaxAugmentationRepReq(ns, faction);
            let currentRep = ns.singularity.getFactionRep(faction)
            if (currentRep >= maxRepReq)
            {
                return true;
            }

            let currectFavor = ns.singularity.getFactionFavor(faction);
            let resetFavor = currectFavor + ns.singularity.getFactionFavorGain(faction);
            return maxRepReq / (1 + resetFavor / 100) * 1.1 < (maxRepReq - currentRep) / (1 + currectFavor / 100);
        })

    return factions.length > 0;
}

export function reset(ns: NS)
{
    let player = ns.getPlayer();
    let augmentations = player.factions.map(faction => getUnboughtAugmentations(ns, faction)).reduce((a, b) => [...new Set([...a, ...b])])
        .sort((a, b) => ns.singularity.getAugmentationBasePrice(b) - ns.singularity.getAugmentationBasePrice(a));
    for (let augmentation of augmentations)
    {
        buyAugmentation(ns, augmentation);
    }

    while(buyAugmentation(ns, "NeuroFlux Governor"))
    {
    }

    while(ns.singularity.upgradeHomeRam())
    {
    }

    ns.singularity.installAugmentations("start.js");
}

export function autocomplete(data: AutocompleteData, args: ScriptArg) {
    return allFactions;
}

/** @param {import("../..").NS} ns */
export async function main(ns: NS) 
{
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