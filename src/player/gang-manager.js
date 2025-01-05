/** @param {import("../..").NS} ns */
export async function main(ns) {
    const training = 'Train Combat';
    const vigil = 'Vigilante Justice';
    // ns.tprint(ns.gang.getTaskStats(vigil));
    const tasks = ['Mug People', 'Deal Drugs', 'Strongarm Civilians', 'Run a Con', 'Armed Robbery', 'Traffick Illegal Arms',
        'Threaten & Blackmail', 'Human Trafficking', 'Terrorism'
    ];
    // const tasks = ns.gang.getTaskNames();
    const territory = 'Territory Warfare';
    const ascension_mult = 1.6;
    const priority_switch_member_count = 10;
    const min_yield = 0.02;
    while (true) {
        if (ns.gang.canRecruitMember) {
            var name = new Date().toUTCString()
            if (ns.gang.recruitMember(name)) {
                ns.tprint(`Recruit a gang member "${name}".`);
                ns.gang.setMemberTask(name, training);
            }
        }
        var members = ns.gang.getMemberNames();
        const total_members = members.length;
        const priority = total_members > priority_switch_member_count ? ns.formulas.gang.moneyGain : ns.formulas.gang.respectGain;
        const gang_info = ns.gang.getGangInformation();
        const other_gang_info = ns.gang.getOtherGangInformation();
        var engage_territory = gang_info.territory < 1;
        for (const gang in other_gang_info) {
            if (gang != gang_info.faction && other_gang_info[gang].territory > 0 && other_gang_info[gang].power * 4 >= gang_info.power) {
                // ns.tprint(`${gang}: ${other_gang_info[gang].power}`);
                engage_territory = false;
                break;
            }
        }
        // ns.tprint(engage_territory);
        ns.gang.setTerritoryWarfare(engage_territory);
        const members_to_ascend = members.filter((m) => {
            const asc = ns.gang.getAscensionResult(m);
            return asc != undefined && (asc.agi >= ascension_mult || asc.cha >= ascension_mult || asc.def >= ascension_mult ||
                asc.dex >= ascension_mult || asc.hack >= ascension_mult || asc.str >= ascension_mult);
        })
        for (const member of members_to_ascend) {
            ns.gang.ascendMember(member);
            ns.tprint(`Ascend gang member "${member}".`);
            ns.gang.setMemberTask(member, training);
        }
        members = members.filter((m) => !members_to_ascend.includes(m));
        if (members.length > 0) {
            var member_detail = [];
            for (const member of members) {
                const member_info = ns.gang.getMemberInformation(member)
                member_detail.push({
                    name: member,
                    info: member_info,
                    wanted_level: ns.formulas.gang.wantedLevelGain(gang_info, member_info, ns.gang.getTaskStats(vigil))
                })
            }
            member_detail = member_detail.sort((a, b) => a.wanted_level - b.wanted_level);
            var member_task_count = 0
            if (gang_info.wantedPenalty <= 0.9 && gang_info.wantedLevel > 1) {
                for (const member of member_detail) {
                    // ns.tprint(member.wanted_level);
                    var task_to_do = member.wanted_level <= Math.min(member_detail[0].wanted_level / 2, -0.01 / 5) ? vigil : training;
                    if (task_to_do == vigil) {
                        member_task_count++;
                        if (member_task_count > Math.max(total_members * 0.5, 3)) {
                            task_to_do = gang_info.territory < 1 && !engage_territory ? territory : training;
                        }
                    }
                    ns.print(`Set gang member "${member.name}" to do ${task_to_do}.`);
                    ns.gang.setMemberTask(member.name, task_to_do);
                }
            } else {
                const min_wanted_level = -member_detail[0].wanted_level / 5;
                // ns.tprint(min_yield / min_wanted_level);
                for (const member of member_detail) {
                    const best_task = tasks.sort((a, b) => {
                        const b_stats = ns.gang.getTaskStats(b);
                        const a_stats = ns.gang.getTaskStats(a);
                        return priority(gang_info, member.info, b_stats) / Math.max(min_wanted_level, ns.formulas.gang.wantedLevelGain(gang_info, member.info, b_stats)) -
                            priority(gang_info, member.info, a_stats) / Math.max(min_wanted_level, ns.formulas.gang.wantedLevelGain(gang_info, member.info, a_stats))
                    })[0];
                    member.task = best_task;
                    member.task_yield = priority(gang_info, member.info, ns.gang.getTaskStats(member.task)) /
                        Math.max(min_wanted_level, ns.formulas.gang.wantedLevelGain(gang_info, member.info, ns.gang.getTaskStats(member.task)));
                }
                member_detail = member_detail.sort((a, b) => b.task_yield - a.task_yield);
                // ns.tprint(member_detail);
                for (const member of member_detail) {
                    // ns.tprint(member.task_yield);
                    var task_to_do = member.task_yield > Math.max(member_detail[0].task_yield / 2, min_yield / min_wanted_level) ? member.task : training;
                    if (task_to_do == member.task) {
                        member_task_count++;
                        if (member_task_count > Math.max(total_members * 0.5, 3)) {
                            task_to_do = gang_info.territory < 1 && !engage_territory ? territory : training;
                        }
                    }
                    // ns.tprint(`Set gang member "${member.name}" to do ${task_to_do}.`);
                    ns.gang.setMemberTask(member.name, task_to_do);
                }
            }
        }
        const delay = ns.gang.getBonusTime() > 0 ? 2000 : 20000;
        // ns.tprint(ns.gang.getBonusTime());
        await ns.sleep(delay);
    }

}