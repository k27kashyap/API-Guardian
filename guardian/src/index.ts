import fs from "node:fs";
import { discoverApis } from "./api-discover.js";
import { scanProject } from "./project-scanner.js";
import { analyzeResponse } from "./response-analyzer.js";

const command = process.argv[2];
const path = process.argv[3];

if(command == "analyze"){

    if (!path) {
        console.error("Please provide a project path.");
        console.error("Usage: guardian analyze <project-path>");
        process.exit(1);
    }

    console.log(`Analyzing API Contracts for: ${path}`);

    const structure = scanProject(path);

    console.log("");
    console.log("Project structure:");
    console.log(`  Frontend: ${structure.frontend ? "found" : "not found"}`);
    console.log(`  Backend:  ${structure.backend ? "found" : "not found"}`);
    console.log(`  Contract: ${structure.contract ? "found" : "not found"}`);

    const apis = discoverApis(path);
    console.log("");
    console.log("Discovered APIs: ");

    if(apis.length === 0){
        console.log(" No APIs found");
    } else{
        for(const api of apis){
            console.log(`  ${api.method} ${api.path}`);
            const content = fs.readFileSync(api.file, "utf-8");
            const res = analyzeResponse(content);

            if(res){
                console.log(`  Response type: ${res.type}`);

                if(res.fields){
                    for(const field of res.fields){
                        console.log(`   ${field.name}: ${field.type}`);
                    }
                }
            }
        }
    }

} else {
    console.log("API Contract Guardian");
    console.log("");
    console.log("Commands:");
    console.log("  analyze    Analyze API contracts");
}