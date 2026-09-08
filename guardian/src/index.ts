import { discoverApis } from "./api-discover.js";
import { checkContract } from "./contract-checker.js";
import { scanProject } from "./project-scanner.js";
import { loadContracts } from "./contract-loader.js";
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

    const contracts = loadContracts(path);

    console.log("");
    console.log("Contracts:");

    if(contracts.length === 0){
        console.log("  No contracts found.");
    } else {
        for(const contract of contracts){
            console.log(`  ${contract.method} ${contract.endpoint}`);
        }
    }

    const apis = discoverApis(path);
    console.log("");
    console.log("Discovered APIs: ");

    if(apis.length === 0){
        console.log(" No APIs found");
    } else{
       for (const api of apis) {
            console.log(`  ${api.method} ${api.path}`);
            const response = analyzeResponse(api.file);

            if (!response) {
                console.log("    Could not analyze response.");
                continue;
            }

            const contract = contracts.find(
                (contract) =>
                    contract.method === api.method &&
                    contract.endpoint === api.path
            );

            if (!contract) {
                console.log("    ⚠ No contract found.");
                continue;
            }

            const result = checkContract(contract, response);

            if (result.matches) {
                console.log("    ✓ Contract matches backend response.");
            } else {
                console.log("    ✗ Contract mismatch:");
                for (const issue of result.issues) {
                    console.log(`      - ${issue}`);
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