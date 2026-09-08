import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

export type ApiEndpoint = {
    method: string;
    path: string;
    file: string;
}

export function discoverApis(projectPath : string): ApiEndpoint[] {
    const bePath = path.resolve(projectPath, "backend");
    const sourcePath = path.join(bePath, "src");

    if(!fs.existsSync(sourcePath)){
        return [];
    }

    const files = getTypeScriptFiles(sourcePath);
    const endpoints: ApiEndpoint[] = [];

    for (const file of files){

        const content = fs.readFileSync(file, "utf-8");

        const sourceFile = ts.createSourceFile(
            file,
            content,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS
        );

        function visit(node: ts.Node) {
            if(ts.isCallExpression(node)){
                const expression = node.expression;

                if(ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)) {
                    const method = expression.name.text.toUpperCase();
                    const firstArg = node.arguments[0];

                    if(firstArg && ts.isStringLiteral(firstArg) && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)){
                        endpoints.push({
                            method,
                            path: firstArg.text,
                            file,
                        });
                    }
                }
            }
            ts.forEachChild(node,visit);
        }

        visit(sourceFile);
    }
    return endpoints;
}

function getTypeScriptFiles(directory: string) : string[] {
    const files : string[] = [];

    const entries = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for(const entry of entries){
        const fullPath = path.join(directory, entry.name);

        if(entry.isDirectory()){
            files.push(...getTypeScriptFiles(fullPath));
        } else if(entry.isFile() && entry.name.endsWith(".ts")){
            files.push(fullPath);
        }
    }
    return files;
}