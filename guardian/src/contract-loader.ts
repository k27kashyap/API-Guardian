import fs from "node:fs";
import path from "node:path";

export type ApiContract = {
    endpoint: string;
    method: string;
    response: {
        type: string;
        items: Record<string, string>;
    };
};

export function loadContracts(projectPath: string): ApiContract[] {
    const contractPath = path.resolve(projectPath, "contract");

    if(!fs.existsSync(contractPath)){
        return [];
    }

    const files = fs.readdirSync(contractPath).filter((file) => file.endsWith(".json"));

    const contracts: ApiContract[] = [];

    for (const file of files){
        const filePath = path.join(contractPath, file);
        const content = fs.readFileSync(filePath, "utf-8");

        const contract = JSON.parse(content) as ApiContract;

        contracts.push(contract);
    }

    return contracts;
}