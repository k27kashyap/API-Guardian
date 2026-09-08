import fs from "node:fs";
import ts from "typescript";

export type ResponseField = {
  name: string;
  type: string;
};

export type ApiResponse = {
  type: string;
  fields?: ResponseField[];
};

export function analyzeResponse(
  filePath: string,
): ApiResponse | null {
  const content = fs.readFileSync(filePath, "utf-8");

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let result: ApiResponse | null = null;

  function visit(node: ts.Node) {
    if (result) {
      return;
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (
        ts.isPropertyAccessExpression(expression) &&
        expression.name.text === "json"
      ) {
        const object = expression.expression;

        if (ts.isIdentifier(object) && object.text === "res") {
          const argument = node.arguments[0];

          if (argument) {
            result = analyzeExpression(argument);
            return;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  function analyzeExpression(node: ts.Expression): ApiResponse {
    if (ts.isArrayLiteralExpression(node)) {
      const firstElement = node.elements[0];

      if (firstElement && ts.isObjectLiteralExpression(firstElement)) {
        const fields: ResponseField[] = [];

        for (const property of firstElement.properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }

          const name = property.name.getText(sourceFile);
          const type = getExpressionType(property.initializer);

          fields.push({
            name,
            type,
          });
        }

        return {
          type: "array",
          fields,
        };
      }

      return {
        type: "array",
      };
    }

    if (ts.isObjectLiteralExpression(node)) {
      return {
        type: "object",
      };
    }

    return {
      type: "unknown",
    };
  }

  function getExpressionType(node: ts.Expression): string {
    if (ts.isNumericLiteral(node)) {
      return "number";
    }

    if (ts.isStringLiteral(node)) {
      return "string";
    }

    if (node.kind === ts.SyntaxKind.TrueKeyword ||
        node.kind === ts.SyntaxKind.FalseKeyword) {
      return "boolean";
    }

    return "unknown";
  }

  visit(sourceFile);

  return result;
}