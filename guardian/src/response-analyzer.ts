export type ResponseField = {
    name: string;
    type: string;
}

export type ApiResponse = {
    type: string;
    fields?: ResponseField[];
}

export function analyzeResponse(content: string) : ApiResponse | null {
    const resJsonMatch = content.match(/res\.json\(\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*\)/);

    if(!resJsonMatch){
        return null;
    }

    const res = resJsonMatch[1];

    if (res.startsWith("[")){
        const objectMatch = res.match(/\{\s*([\s\S]*?)\s*\}/);

        if(!objectMatch){
            return {
                type: "array",
            };
        }

        const fields: ResponseField[] = [];
        const fieldRegex = /(\w+)\s*:\s*([^,\n}]+)/g;

        let match;

        while((match = fieldRegex.exec(objectMatch[1])) !== null){
            const value = match[2].trim();

            let type = "unknown";

            if(!isNaN(Number(value))){
                type = "number";
            } else if(
                value.startsWith('"') || value.startsWith("'")
            ) {
                type = "string";
            } else if (value === "true" || value === "false"){
                type = "boolean";
            }

            fields.push({
                name: match[1],
                type,
            });
        }

        return {
            type: "array",
            fields,
        };
    }

    return {
        type: "object",
    };
}