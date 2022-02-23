/** @param {import("../.").NS} ns */
export async function main(ns) {
    const general_actions = [{
            type: 'general',
            name: 'Training'
        },
        {
            type: 'general',
            name: 'Field Analysis'
        },
        {
            type: 'general',
            name: 'Diplomacy'
        },
        {
            type: 'general',
            name: 'Hyperbolic Regeneration Chamber'
        }
    ];
    const contracts = [{
            type: 'contracts',
            name: 'Tracking'
        },
        {
            type: 'contracts',
            name: 'Bounty Hunter'
        },
        {
            type: 'contracts',
            name: 'Retirement'
        }
    ];
    const operations = [{
            type: 'operations',
            name: 'Investigation'
        },
        {
            type: 'operations',
            name: 'Undercover Operation'
        },
        {
            type: 'operations',
            name: 'Sting Operation'
        },
        {
            type: 'operations',
            name: 'Stealth Retirement Operation'
        },
        {
            type: 'operations',
            name: 'Assassination'
        }
    ];
    const contract_operations = contracts.concat(operations);
    var rest = false;
    while (true) {
        const [current_stamina, max_stamina] = ns.bladeburner.getStamina();
        const stamina_percentage = current_stamina / max_stamina;
        if (stamina_percentage < 0.55) {
            rest = true;
        } else if (stamina_percentage > 0.95) {
            rest = false;
        }
        var action;
        var action_time;
        var avaliable_actions = contract_operations.filter((o) => ns.bladeburner.getActionCountRemaining(o.type, o.name) > 0);
        if (avaliable_actions.length == 0) {
            action = {
                type: 'general',
                name: 'Field Analysis'
            };
        } else {
            var safe_contract_operations = avaliable_actions.filter((o) => ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name)[1] == 1);
            if (safe_contract_operations.length == 0) {
                if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
                    action = {
                        type: 'general',
                        name: 'Diplomacy'
                    };
                } else {
                    action = {
                        type: 'general',
                        name: 'Training'
                    };
                }
            } else if (contract_operations.filter((o) => {
                    const [min, max] = ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name);
                    return min < max;
                }).length > 0) {
                action = {
                    type: 'general',
                    name: 'Field Analysis'
                };
            } else if (rest) {
                action = {
                    type: 'general',
                    name: 'Hyperbolic Regeneration Chamber'
                };
            } else {
                var safe_contract_operations = avaliable_actions.filter((o) => ns.bladeburner.getActionEstimatedSuccessChance(o.type, o.name)[0] == 1);
                safe_contract_operations = safe_contract_operations.sort((a, b) => {
                    function repRate(action) {
                        const level = ns.bladeburner.getActionCurrentLevel(action.type, action.name);
                        const time = ns.bladeburner.getActionTime(action.type, action.name);
                        const rep = ns.bladeburner.getActionRepGain(action.type, action.name, level);
                        return rep / time;
                    }
                    return repRate(b) - repRate(a);
                });
                action = safe_contract_operations[0];
            }
        }
        action_time = ns.bladeburner.getActionTime(action.type, action.name);
        while(!ns.bladeburner.startAction(action.type, action.name)) {
            await ns.sleep(100);
        }
        const bonus_time = ns.bladeburner.getBonusTime();
        const delay = action_time - 0.8 * Math.min(action_time, bonus_time * 1000);
        await ns.sleep(delay);
    }
}