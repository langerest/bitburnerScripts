import { NS } from "..";

export abstract class Module
{
    ram: number;
    isLoaded: boolean;

    constructor(ram: number)
    {
        this.ram = ram;
        this.isLoaded = false;
    }

    shouldload(ns: NS, currentRam: number, scriptTotalRam: number)
    {
        return ns.getServerMaxRam("home") >= Math.min(this.ram +  currentRam, scriptTotalRam);
    }

    load(ns: NS)
    {
        this.isLoaded = true;
    }

    abstract shouldExecute(ns: NS): boolean;
    abstract execute(ns: NS): void | Promise<void>
}
