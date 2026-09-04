import fs from "node:fs";
import path from "node:path";

export type ProjectStructure = {
    frontend: boolean;
    backend : boolean;
    contract: boolean;
};

export function scanProject(projectPath: string): ProjectStructure {
    const absolutePath = path.resolve(projectPath);

    return {
        frontend: fs.existsSync(path.join(absolutePath, "frontend")),
        backend: fs.existsSync(path.join(absolutePath, "backend")),
        contract: fs.existsSync(path.join(absolutePath, "contract")),
    };
}