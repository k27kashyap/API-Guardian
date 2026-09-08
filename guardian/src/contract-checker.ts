import type { ApiContract } from "./contract-loader";
import type { ApiResponse } from "./response-analyzer";

export type ContractCheckResult = {
    endpoint : string;
    method: string;
    matches: boolean;
    issues : string[];
};

export function checkContract(contract: ApiContract, actualResponse: ApiResponse) : ContractCheckResult {
    const issues : string[] = [];

    if (contract.response.type !== actualResponse.type) {
        issues.push(`Expected response type "${contract.response.type}" but found "${actualResponse.type}"`);
    };

    if(contract.response.items && actualResponse.fields){
        const expectedFields = contract.response.items;

        for (const [fieldName, expectedType] of Object.entries(expectedFields)) {
            const actualField = actualResponse.fields.find((field) => field.name === fieldName);

            if(!actualField) {
                issues.push(`Missing field "${fieldName}"`);
                continue;
            }

            if(actualField.type !== expectedType) {
                issues.push(`Field "${fieldName}" expected type "${expectedType}" but found "${actualField.type}"`);
            }
        }

        for (const actualField of actualResponse.fields) {
            if (!(actualField.name in expectedFields)){
                issues.push(`Unexpected field "${actualField.name}"`);
            }
        }
    }

    return {
        endpoint: contract.endpoint,
        method: contract.method,
        matches: issues.length === 0,
        issues,
    };
}