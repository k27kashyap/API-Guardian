import fs from "node:fs";
import path from "node:path";

export type ApiEndpoint = {
    method: string;
    path: string;
    file: string;
}

export function discoverApis(projectPath : string): ApiEndpoint[] {
    const bePath = path.resolve(projectPath, "backend");
    const indexPath = path.join(bePath, "src", "index.ts");

    if(!fs.existsSync(indexPath)){
        return [];
    }

    const content = fs.readFileSync(indexPath, "utf-8");

    const endPoints: ApiEndpoint[] = [];

    const routeRegex = /app\.(get|post|put|patch|delete)\(["']([^"']+)["']/g;

    let match;

    while((match = routeRegex.exec(content)) !== null){
        endPoints.push({
            method: match[1].toUpperCase(),
            path: match[2],
            file: indexPath,
        });
    }

    return endPoints;
}