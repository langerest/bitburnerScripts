export const MaterialSizes = {
    Water: 0.05,
    Energy: 0.01,
    Food: 0.03,
    Plants: 0.05,
    Metal: 0.1,
    Hardware: 0.06,
    Chemicals: 0.05,
    Drugs: 0.02,
    Robots: 0.5,
    AICores: 0.1,
    RealEstate: 0.005,
}

export const IndustrialFactors = {
    Energy: {
        reFac :0.65,
        sciFac:0.7,
        hwFac :0,
        robFac:0.05,
        aiFac :0.3,
        advFac:0.08,
    },
    Utilities: {
        reFac :0.5,
        sciFac:0.6,
        hwFac :0,
        robFac:0.4,
        aiFac :0.4,
        advFac:0.08,
    },
    Agriculture: {
        reFac :0.72,
        sciFac:0.5,
        hwFac :0.2,
        robFac:0.3,
        aiFac :0.3,
        advFac:0.04,
    },
    Fishing: {
        reFac :0.15,
        sciFac:0.35,
        hwFac :0.35,
        robFac:0.5,
        aiFac :0.2,
        advFac:0.08,
    },
    Mining: {
        reFac :0.3,
        sciFac:0.26,
        hwFac :0.4,
        robFac:0.45,
        aiFac :0.45,
        advFac:0.06,
    },
    Food: {
        reFac :0.05,
        sciFac:0.12,
        hwFac :0.15,
        robFac:0.3,
        aiFac :0.25,
        advFac:0.25,
    },
    Tobacco: {
        reFac :0.15,
        sciFac:0.75,
        hwFac :0.15,
        robFac:0.2,
        aiFac :0.15,
        advFac:0.2,
    },
    Chemical: {
        reFac :0.25,
        sciFac:0.75,
        hwFac :0.2,
        robFac:0.25,
        aiFac :0.2,
        advFac:0.07,
    },
    Pharmaceutical: {
        reFac :0.05,
        sciFac:0.8,
        hwFac :0.15,
        robFac:0.25,
        aiFac :0.2,
        advFac:0.16,
    },
    Computer: {
        reFac :0.2,
        sciFac:0.62,
        hwFac :0,
        robFac:0.36,
        aiFac :0.19,
        advFac:0.17,
    },
    Robotics: {
        reFac :0.32,
        sciFac:0.65,
        hwFac :0.19,
        robFac:0,
        aiFac :0.36,
        advFac:0.18,
    },
    Software: {
        reFac :0.15,
        sciFac:0.62,
        hwFac :0.25,
        robFac:0.05,
        aiFac :0.18,
        advFac:0.16,
    },
    Healthcare: {
        reFac :0.1,
        sciFac:0.75,
        hwFac :0.1,
        robFac:0.1,
        aiFac :0.1,
        advFac:0.11,
    },
    RealEstate: {
        reFac :0,
        sciFac:0.05,
        hwFac :0.05,
        robFac:0.6,
        aiFac :0.6,
        advFac:0.25,
    }
}

/** @param {import("../.").NS} ns */
export function calc_material(ns, warehouse_size, industry) {
    var realEstate = {
        amount: 0,
        size: MaterialSizes.RealEstate,
        factor: IndustrialFactors[industry].reFac
    };
    var hardware = {
        amount: 0,
        size: MaterialSizes.Hardware,
        factor: IndustrialFactors[industry].hwFac
    };
    var robots = {
        amount: 0,
        size: MaterialSizes.Robots,
        factor: IndustrialFactors[industry].robFac
    };
    var aiCores = {
        amount: 0,
        size: MaterialSizes.AICores,
        factor: IndustrialFactors[industry].aiFac
    };

    var materials = [realEstate, hardware, robots, aiCores];
    var bad_materials = [];
    var not_to_calculate_materials = materials.filter(m => m.factor == 0);

    do {
        var total_factor = 0;
        var total_size = 0;
        for (const material of materials) {
            total_factor += material.factor;
            total_size += material.size;
        }
        for (var material of materials) {
            if (!not_to_calculate_materials.includes(material)) {
                material.amount = Math.floor(material.factor / material.size / total_factor * (warehouse_size + 
                    500 * (total_size - total_factor / material.factor * material.size)));
            }
        }
        bad_materials = materials.filter(m => m.amount < 0);
        not_to_calculate_materials = materials.filter(m => m.amount <= 0);
        for (var material of bad_materials) {
            material.amount = 0;
            material.size = 0;
            material.factor = 0;
        }
    } while(bad_materials.length)

    return {
        'Real Estate': realEstate,
        'Hardware': hardware,
        'Robots': robots,
        'AI Cores': aiCores,
    };
}

export function autocomplete(data, args) {
	return ['Energy', 'Utilities', 'Agriculture', 'Fishing', 'Mining', 'Food', 'Tobacco', 'Chemical', 'Pharmaceutical',
     'Computer', 'Robotics', 'Software', 'Healthcare', 'RealEstate'];
}

/** @param {import("../.").NS} ns */
export async function main(ns) {
    const warehouse_size = ns.args[0];
    const industry = ns.args[1];

    var result = calc_material(ns, warehouse_size, industry);
    const realEstate = result['Real Estate'];
    const hardware = result['Hardware'];
    const robots = result['Robots'];
    const aiCores = result['AI Cores'];

    var total_size = realEstate.amount * MaterialSizes.RealEstate + hardware.amount * MaterialSizes.Hardware + robots.amount * MaterialSizes.Robots + aiCores.amount * MaterialSizes.AICores;
    ns.tprint(`Real Estate: ${realEstate.amount} Hardware: ${hardware.amount} Robots: ${robots.amount} AI Cores: ${aiCores.amount} Total size: ${total_size}`);
}