/** @param {import("../.").NS} ns */
export async function main(ns) {
    var cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
    const general_actions = [{
            type: 'General',
            name: 'Training'
        },
        {
            type: 'General',
            name: 'Field Analysis'
        },
        {
            type: 'General',
            name: 'Diplomacy'
        },
        {
            type: 'General',
            name: 'Hyperbolic Regeneration Chamber'
        }
    ];
    const contracts = [{
            type: 'Contract',
            name: 'Tracking'
        },
        {
            type: 'Contract',
            name: 'Bounty Hunter'
        },
        {
            type: 'Contract',
            name: 'Retirement'
        }
    ];
    const operations = [{
            type: 'Operation',
            name: 'Investigation'
        },
        {
            type: 'Operation',
            name: 'Undercover Operation'
        },
        {
            type: 'Operation',
            name: 'Sting Operation'
        },
        {
            type: 'Operation',
            name: 'Stealth Retirement Operation'
        },
        {
            type: 'Operation',
            name: 'Assassination'
        }
    ];
    const contract_operations = contracts.concat(operations);
    const skills = [{
            name: 'Blade\'s Intuition',
            max_level: Infinity
        },
        {
            name: 'Reaper',
            max_level: Infinity
        },
        {
            name: 'Evasive System',
            max_level: Infinity
        },
        {
            name: 'Digital Observer',
            max_level: Infinity
        },
        {
            name: 'Cloak',
            max_level: 25
        },
        {
            name: 'Short-Circuit',
            max_level: 25
        },
        {
            name: 'Tracer',
            max_level: 10
        },
        {
            name: 'Overclock',
            max_level: 90
        },
        {
            name: 'Cyber\'s Edge',
            max_level: 10
        },
        {
            name: 'Hands of Midas',
            max_level: 10
        },
        {
            name: 'Hyperdrive',
            max_level: 10
        },
    ]
    var rest = false;
    while (true) {
        while (true) {
            const skill = skills.filter((s) => ns.bladeburner.getSkillLevel(s.name) < s.max_level).sort((a, b) =>
                ns.bladeburner.getSkillUpgradeCost(a.name) - ns.bladeburner.getSkillUpgradeCost(b.name))[0];
            if (ns.bladeburner.getSkillPoints() >= ns.bladeburner.getSkillUpgradeCost(skill.name)) {
                ns.bladeburner.upgradeSkill(skill.name);
            } else {
                break;
            }
        }
        const [current_stamina, max_stamina] = ns.bladeburner.getStamina();
        const stamina_percentage = current_stamina / max_stamina;
        if (stamina_percentage < 0.55) {
            rest = true;
        } else if (stamina_percentage > 0.95) {
            rest = false;
        }
        cities = cities.sort((a, b) => {
            function successrate(city) {
                ns.bladeburner.switchCity(city);
                const [min, max] = ns.bladeburner.getActionEstimatedSuccessChance('operations', 'Assassination');
                return max == 1 ? max + min : (max + min) / 2;
            }
            return successrate(b) - successrate(a);
        })
        // ns.tprint(cities);
        ns.bladeburner.switchCity(cities[0]);
        var action;
        var action_time;
        var avaliable_actions = contract_operations.filter((o) => ns.bladeburner.getActionCountRemaining(o.type, o.name) > 0);
        if (avaliable_actions.length == 0) {
            if (ns.bladeburner.getRank() < 400000) {
                action = {
                    type: 'General',
                    name: 'Field Analysis'
                };
            }
            else{
                action = {
                    type: 'General',
                    name: 'Training'
                };
            }
        } else {
            var safe_contract_operations = avaliable_actions.filter((o) => ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name)[1] == 1);
            var blackop_name = ns.bladeburner.getBlackOpNames().find((o) => ns.bladeburner.getActionCountRemaining('BlackOps', o) > 0);
            var blackop = {
                type: 'BlackOps',
                name: blackop_name
            };
            if (safe_contract_operations.length == 0) {
                if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
                    action = {
                        type: 'General',
                        name: 'Diplomacy'
                    };
                } else {
                    action = {
                        type: 'General',
                        name: 'Training'
                    };
                }
            } else if (contract_operations.filter((o) => {
                    const [min, max] = ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name);
                    return min < max;
                }).length > 0 ||
                ns.bladeburner.getActionEstimatedSuccessChance(blackop.type, blackop.name)[0] < ns.bladeburner.getActionEstimatedSuccessChance(blackop.type, blackop.name)[1]) {
                action = {
                    type: 'General',
                    name: 'Field Analysis'
                };
            } else if (rest) {
                action = {
                    type: 'General',
                    name: 'Hyperbolic Regeneration Chamber'
                };
            } else {
                if (ns.bladeburner.getRank() >= ns.bladeburner.getBlackOpRank(blackop.name) && ns.bladeburner.getActionEstimatedSuccessChance(blackop.type, blackop.name)[0] == 1) {
                    action = blackop;
                } else {
                    var safe_contract_operations = avaliable_actions.filter((o) => ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name)[0] == 1);
                    safe_contract_operations = safe_contract_operations.sort((a, b) => {
                        function repRate(action) {
                            const level = ns.bladeburner.getActionMaxLevel(action.type, action.name);
                            ns.bladeburner.setActionLevel(action.type, action.name, 1);
                            const time = ns.bladeburner.getActionTime(action.type, action.name);
                            // const rep = ns.bladeburner.getActionRepGain(action.type, action.name, level);
                            const rep = ns.bladeburner.getActionRepGain(action.type, action.name, 1);
                            ns.bladeburner.setActionLevel(action.type, action.name, level);
                            return rep / time;
                        }
                        return repRate(b) - repRate(a);
                    });
                    action = safe_contract_operations[0];
                }
            }
        }
        action_time = ns.bladeburner.getActionTime(action.type, action.name);
        var current_action = ns.bladeburner.getCurrentAction();
        if (current_action.type != action.type || current_action.name != action.name) {
            while (!ns.bladeburner.startAction(action.type, action.name)) {
                await ns.sleep(100);
            }
        }
        const bonus_time = ns.bladeburner.getBonusTime();
        const delay = Math.ceil((action_time - 0.8 * Math.min(action_time, bonus_time * 1000)) / 1000) * 1000;
        await ns.sleep(delay);
    }
}