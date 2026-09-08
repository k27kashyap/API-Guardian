# API Contract Guardian — Full Project Context

## 1. Project Overview

I am building a project called **API Contract Guardian**.

The goal is to build a developer/CLI tool that analyzes a real-world application and detects **API contract mismatches between the backend, frontend, and an explicit API contract**.

The project should eventually be useful as a CI/CD/developer tool that can catch API breaking changes before they reach production.

The core idea is:

```text
Frontend
   │
   │ expects
   ▼
API Contract
   ▲
   │ must match
   │
Backend
```

Guardian should inspect the application and determine whether the API being implemented by the backend still matches the expected contract and, eventually, whether the frontend's API usage is also compatible.

---

# 2. Development Philosophy

The implementation is intentionally being done incrementally.

Important decisions:

* Do NOT over-engineer the project initially.
* Build a minimal working version first.
* Test every stage against a small fake real-world application.
* Once the basic pipeline works, progressively make the analyzer more sophisticated.
* Prefer understanding the architecture and implementation rather than blindly adding libraries.
* We initially used simple regex-based analysis to get the pipeline working, then upgraded backend analysis to use the TypeScript AST.
* We eventually want the project to be technically strong enough to discuss in software engineering interviews.

The project is currently a **CLI tool**, not a web application.

---

# 3. Current Tech Stack

## Guardian

* Node.js
* TypeScript
* `tsx`
* TypeScript Compiler API / AST
* Node built-in filesystem APIs
* Node built-in path APIs

## Test application backend

* Node.js
* TypeScript
* Express
* CORS
* `tsx`

## Test application frontend

* React
* Vite
* TypeScript

## Repository structure

Monorepo-style structure:

```text
API Guardian/
├── guardian/
│   ├── src/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── test-project/
│   ├── frontend/
│   ├── backend/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── node_modules/
│   │   └── tsconfig.json
│   │
│   └── contract/
│       └── users.json
│
├── package.json
├── package-lock.json
└── README.md
```

The `test-project` is very important.

Instead of immediately making Guardian analyze arbitrary GitHub repositories, we created a controlled fake application that represents a small real-world frontend/backend system.

This allows us to deliberately introduce breaking API changes and verify that Guardian catches them.

---

# 4. Step-by-Step Implementation Completed So Far

## Step 1 — Create the project

Created:

```text
API Guardian/
├── guardian/
│   ├── src/
│   └── package.json
├── test-project/
│   ├── frontend/
│   └── backend/
├── package.json
└── README.md
```

Initially, the `package.json` files were empty files.

This caused an issue when running `npm init -y` because npm could not parse an empty JSON file.

We fixed this by deleting the empty package.json and then running:

```powershell
Remove-Item package.json
npm init -y
```

The same was done for `guardian/package.json`.

---

# Step 2 — Set up Guardian with Node + TypeScript

Guardian is a Node.js CLI written in TypeScript.

Inside:

```text
guardian/
```

we installed:

```powershell
npm install -D typescript tsx @types/node
```

Then initialized TypeScript:

```powershell
npx tsc --init
```

The generated `tsconfig.json` contained many newer TypeScript defaults, including React-related settings.

We simplified it to:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

We explicitly added:

```json
"forceConsistentCasingInFileNames": true
```

because it prevents file-name casing problems that could work on Windows but fail on Linux/CI environments.

---

# Step 2 — Guardian entry point

Created:

```text
guardian/src/index.ts
```

Initially:

```ts
console.log("API Contract Guardian");
```

Added the npm script:

```json
"scripts": {
  "guardian": "tsx src/index.ts"
}
```

Testing:

```powershell
npm run guardian
```

produces:

```text
API Contract Guardian
```

This established the first working Guardian CLI.

---

# Step 3 — Root monorepo command

The root project was also initialized with npm.

Root:

```text
API Guardian/package.json
```

contains a script similar to:

```json
"scripts": {
  "guardian": "npm --prefix guardian run guardian"
}
```

This allows us to run Guardian from the root:

```powershell
npm run guardian
```

instead of needing:

```powershell
cd guardian
npm run guardian
```

The flow is:

```text
Root package.json
       │
       ▼
npm --prefix guardian run guardian
       │
       ▼
guardian/package.json
       │
       ▼
tsx src/index.ts
```

This was tested successfully.

---

# Step 4 — Create the fake test application

Created:

```text
test-project/
├── frontend/
└── backend/
```

The purpose is to have a small application that Guardian can analyze.

---

# Step 4A — Backend

Inside:

```text
test-project/backend/
```

initialized npm:

```powershell
npm init -y
```

Installed:

```powershell
npm install express
npm install -D typescript tsx @types/node @types/express
```

Created TypeScript configuration using:

```powershell
npx tsc --init
```

and simplified it similarly to Guardian.

Backend structure:

```text
backend/
├── src/
│   └── index.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── node_modules/
```

Initial backend API:

```ts
import express from "express";

const app = express();

app.use(express.json());

app.get("/api/users", (req, res) => {
  res.json([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com"
    }
  ]);
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
```

Backend runs with:

```powershell
npm run dev
```

where the script is:

```json
"scripts": {
  "dev": "tsx src/index.ts"
}
```

---

# Step 4B — CORS

The frontend runs on port 5173 and backend on port 3000.

Therefore they are different origins.

Installed:

```powershell
npm install cors
npm install -D @types/cors
```

Backend now starts with:

```ts
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
```

The backend API:

```text
GET http://localhost:3000/api/users
```

returns:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

---

# Step 4C — Frontend

Created React/Vite frontend using:

```powershell
npm create vite@latest frontend -- --template react-ts
```

Then:

```powershell
cd frontend
npm install
```

The frontend runs with:

```powershell
npm run dev
```

and is available around:

```text
http://localhost:5173
```

---

# Step 5 — Connect frontend to backend

`frontend/src/App.tsx` was changed to consume the backend API.

Current conceptual implementation:

```tsx
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

function App() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/users")
      .then((response) => response.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div>
      <h1>Users</h1>

      {users.map((user) => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
```

The frontend successfully displays:

```text
Users

John Doe
john@example.com
```

So the fake application has a genuine frontend → backend API relationship.

---

# Step 6 — Create explicit API contract

Created:

```text
test-project/contract/users.json
```

Current contract:

```json
{
  "endpoint": "/api/users",
  "method": "GET",
  "response": {
    "type": "array",
    "items": {
      "id": "number",
      "name": "string",
      "email": "string"
    }
  }
}
```

This represents the expected contract:

```text
GET /api/users

Response:
Array<Object>

id: number
name: string
email: string
```

This gives Guardian three sources of information:

```text
Frontend
    │
    ▼
API expectations

Contract
    │
    ▼
Expected API shape

Backend
    │
    ▼
Actual API implementation
```

---

# Step 7 — Add `analyze` CLI command

Guardian initially only printed:

```text
API Contract Guardian
```

We then added command parsing using:

```ts
const command = process.argv[2];
```

The CLI became:

```powershell
npm run guardian -- analyze
```

and eventually:

```powershell
npm run guardian -- analyze <project-path>
```

Current conceptual command:

```text
guardian analyze <project-path>
```

---

# Step 8 — Accept project path

Guardian now reads:

```ts
const command = process.argv[2];
const path = process.argv[3];
```

If no path is provided:

```text
Please provide a project path.
Usage: guardian analyze <project-path>
```

Example:

```powershell
npm run guardian -- analyze ../test-project
```

Because of the current `npm --prefix guardian` setup, the Guardian process has `guardian/` as its working directory.

Therefore:

```text
../test-project
```

currently resolves correctly.

This caused an important path bug earlier.

Running:

```powershell
npm run guardian -- analyze ./test-project
```

caused Guardian to look under:

```text
guardian/test-project
```

which did not exist.

Using:

```powershell
npm run guardian -- analyze ../test-project
```

fixed it.

This is a known limitation we should eventually improve so users can naturally run:

```powershell
guardian analyze ./test-project
```

from their current directory.

---

# Step 9 — Project scanner

Created:

```text
guardian/src/project-scanner.ts
```

Current implementation:

```ts
import fs from "node:fs";
import path from "node:path";

export type ProjectStructure = {
  frontend: boolean;
  backend: boolean;
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
```

Guardian now reports:

```text
Project structure:
  Frontend: found
  Backend:  found
  Contract: found
```

---

# Step 10 — Backend API discovery

Created:

```text
guardian/src/api-discover.ts
```

Initially this used regex to find:

```ts
app.get("/api/users", ...)
```

We later upgraded this to use the TypeScript Compiler API / AST.

Current implementation conceptually:

```ts
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export type ApiEndpoint = {
  method: string;
  path: string;
  file: string;
};

export function discoverApis(projectPath: string): ApiEndpoint[] {
  const backendPath = path.resolve(projectPath, "backend");
  const indexPath = path.join(backendPath, "src", "index.ts");

  if (!fs.existsSync(indexPath)) {
    return [];
  }

  const content = fs.readFileSync(indexPath, "utf-8");

  const sourceFile = ts.createSourceFile(
    indexPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const endpoints: ApiEndpoint[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (
        ts.isPropertyAccessExpression(expression) &&
        ts.isIdentifier(expression.expression)
      ) {
        const method = expression.name.text.toUpperCase();

        const firstArgument = node.arguments[0];

        if (
          firstArgument &&
          ts.isStringLiteral(firstArgument) &&
          ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)
        ) {
          endpoints.push({
            method,
            path: firstArgument.text,
            file: indexPath,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return endpoints;
}
```

Guardian can now discover:

```text
Discovered APIs:
  GET /api/users
```

The important improvement is that we're no longer relying on raw regex to identify routes.

---

# Step 11 — Response analysis

Created:

```text
guardian/src/response-analyzer.ts
```

Initially this used regex.

It was then upgraded to use the TypeScript AST as well.

Current conceptual behavior:

```text
Backend source
      ↓
TypeScript AST
      ↓
Find res.json(...)
      ↓
Inspect returned expression
      ↓
Determine response shape
```

For:

```ts
res.json([
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
  }
]);
```

Guardian determines:

```text
Response type: array

id: number
name: string
email: string
```

The current analyzer handles the simple literal case.

It understands:

* arrays
* objects
* numeric literals
* string literals
* booleans

and returns an `ApiResponse` structure.

Current conceptual types:

```ts
export type ResponseField = {
  name: string;
  type: string;
};

export type ApiResponse = {
  type: string;
  fields?: ResponseField[];
};
```

Current function:

```ts
analyzeResponse(filePath: string): ApiResponse | null
```

It parses the source file with:

```ts
ts.createSourceFile(...)
```

and recursively walks the AST looking for:

```text
res.json(...)
```

---

# Step 12 — Contract loader

Created:

```text
guardian/src/contract-loader.ts
```

Purpose:

```text
contract/users.json
        ↓
JSON parsing
        ↓
ApiContract object
```

Current conceptual types:

```ts
export type ApiContract = {
  endpoint: string;
  method: string;
  response: {
    type: string;
    items?: Record<string, string>;
  };
};
```

`loadContracts(projectPath)`:

* locates the project's `contract/` directory
* finds `.json` files
* reads them
* parses JSON
* returns an array of contracts

Guardian now prints:

```text
Contracts:
  GET /api/users
```

---

# Step 13 — Contract checker

Created:

```text
guardian/src/contract-checker.ts
```

This is the first genuinely core Guardian feature.

The checker compares:

```text
EXPECTED CONTRACT
       vs
ACTUAL BACKEND RESPONSE
```

Current conceptual result:

```ts
export type ContractCheckResult = {
  endpoint: string;
  method: string;
  matches: boolean;
  issues: string[];
};
```

The checker currently verifies:

1. Response type
2. Missing fields
3. Field type mismatches
4. Unexpected fields

Example expected:

```text
id: number
name: string
email: string
```

Actual:

```text
id: number
name: string
email: string
```

Result:

```text
✓ Contract matches backend response.
```

---

# Step 14 — Breaking change test

We deliberately changed the backend from:

```ts
name: "John Doe"
```

to:

```ts
username: "John Doe"
```

without changing the contract.

Guardian correctly detected:

```text
✗ Contract mismatch:
  - Missing field "name".
  - Unexpected field "username".
```

This proved that Guardian is not merely printing information — it can detect a real contract-breaking change.

The backend was then restored to the original `name` version.

---

# Step 15 — CLI output

We discussed eventually making the CLI output cleaner and CI-friendly.

Current output is still relatively verbose and development-oriented.

Desired eventual output is something closer to:

```text
API Contract Guardian
────────────────────────────────

Analyzing: test-project

APIs found: 1
Contracts found: 1

✓ GET /api/users
  Contract matches backend response.

────────────────────────────────
No contract violations found.
```

We also want:

```text
exit code 0 → no violations
exit code 1 → contract violations
```

This is important for CI/CD.

However, we did NOT implement this cleanup yet because we prioritized making the analysis engine stronger first.

---

# Step 16 — Upgrade API discovery to AST

We replaced the original regex-based route discovery with TypeScript AST analysis.

This is important because regex is fragile.

For example:

```ts
app.get(
  "/api/users",
  handler
);
```

should still be recognized.

AST parsing understands the actual structure of the code rather than its exact formatting.

The conceptual AST structure for:

```ts
app.get("/api/users", ...)
```

is:

```text
CallExpression
│
├── PropertyAccessExpression
│   ├── app
│   └── get
│
└── "/api/users"
```

Guardian extracts:

```text
method = GET
path = /api/users
```

---

# Step 17 — Upgrade response analysis to AST

We also upgraded response analysis from regex to TypeScript AST.

The flow is now:

```text
backend/src/index.ts
        ↓
TypeScript AST
        ↓
Find res.json(...)
        ↓
Inspect returned expression
        ↓
Determine response shape
```

For:

```ts
res.json([
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
  }
]);
```

Guardian produces:

```text
array
 ├── id: number
 ├── name: string
 └── email: string
```

We tested both:

### Passing case

Backend:

```ts
name: "John Doe"
```

Contract:

```json
"name": "string"
```

Result:

```text
✓ Contract matches backend response.
```

### Breaking case

Backend:

```ts
username: "John Doe"
```

Contract:

```json
"name": "string"
```

Result:

```text
✗ Contract mismatch:
  - Missing field "name".
  - Unexpected field "username".
```

Both cases work.

---

# 5. Current Guardian Architecture

Current source files:

```text
guardian/
└── src/
    ├── index.ts
    ├── project-scanner.ts
    ├── api-discover.ts
    ├── response-analyzer.ts
    ├── contract-loader.ts
    └── contract-checker.ts
```

Conceptual architecture:

```text
                    CLI
                     │
                     ▼
                 index.ts
                     │
                     ▼
              Project Scanner
                     │
                     ▼
              test-project/
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      frontend    backend    contract
                     │          │
                     ▼          ▼
              API Discovery   Contract
                     │        Loader
                     ▼          │
             Response Analysis  │
                     │          │
                     └────┬─────┘
                          ▼
                  Contract Checker
                          │
                          ▼
                       Result
```

---

# 6. Current Limitations

These are intentional limitations that we should address in later steps.

## 6.1 Only `backend/src/index.ts` is scanned

Current API discovery assumes:

```text
backend/src/index.ts
```

contains the routes.

Real applications may have:

```text
backend/src/routes/users.ts
backend/src/routes/products.ts
backend/src/controllers/users.ts
backend/src/app.ts
```

etc.

Guardian should eventually recursively scan the backend source tree.

---

## 6.2 Response analysis is still limited

AST analysis currently handles simple literal responses.

It can understand something like:

```ts
res.json([
  {
    id: 1,
    name: "John",
    email: "john@example.com"
  }
]);
```

but not necessarily:

```ts
const users = await getUsers();

res.json(users);
```

or:

```ts
return res.json(users);
```

or:

```ts
res.status(200).json(users);
```

or:

```ts
res.json({
  users
});
```

We should progressively improve this.

---

## 6.3 Contract format is our own simple JSON format

Current:

```json
{
  "endpoint": "/api/users",
  "method": "GET",
  "response": {
    "type": "array",
    "items": {
      "id": "number",
      "name": "string",
      "email": "string"
    }
  }
}
```

Eventually we may want to support or migrate toward:

* OpenAPI
* JSON Schema
* TypeScript types
* generated contracts

But don't jump there immediately.

---

## 6.4 Frontend is currently not analyzed by Guardian

The frontend currently consumes:

```ts
fetch("http://localhost:3000/api/users")
```

but Guardian isn't yet inspecting frontend code.

This is one of the major future features.

Eventually Guardian should be able to detect something like:

```text
Frontend expects:
GET /api/users
response:
  id
  name
  email
```

versus:

```text
Backend provides:
GET /api/users
response:
  id
  username
  email
```

and report that the frontend is broken.

---

## 6.5 CLI path handling

Because the root script currently uses:

```json
"guardian": "npm --prefix guardian run guardian"
```

relative paths are resolved relative to the Guardian package's working directory.

Therefore currently we use:

```powershell
npm run guardian -- analyze ../test-project
```

from the repository root.

Eventually we should make path handling robust so:

```powershell
guardian analyze ./test-project
```

works naturally.

---

# 7. Exact Planned Next Steps

After Step 17, the planned roadmap is:

---

## Step 18 — Recursively scan backend source files

Current:

```text
backend/src/index.ts
```

only.

Change to:

```text
backend/src/
├── index.ts
├── routes/
│   └── users.ts
├── controllers/
│   └── users.ts
└── ...
```

Guardian should recursively discover `.ts` files.

Architecture:

```text
backend/src/
      │
      ▼
recursive file scanner
      │
      ▼
all TypeScript files
      │
      ▼
AST route discovery
```

This makes Guardian much closer to a real project analyzer.

---

## Step 19 — Associate routes with their handlers

Instead of simply finding:

```ts
app.get("/api/users", ...)
```

we should identify the handler function.

For example:

```ts
app.get("/api/users", getUsers);
```

Guardian should understand:

```text
GET /api/users
        │
        ▼
getUsers()
```

and then analyze `getUsers()`.

This is necessary for real applications.

---

## Step 20 — Improve response analysis

Support more realistic Express patterns:

```ts
res.json(users);
```

```ts
res.status(200).json(users);
```

```ts
return res.json(users);
```

```ts
return res.status(200).json({
  users
});
```

Eventually resolve simple variables:

```ts
const users = [
  {
    id: 1,
    name: "John"
  }
];

res.json(users);
```

The AST analyzer should follow the variable reference.

---

## Step 21 — Support nested response objects

Currently our contract checker mostly deals with flat fields.

Add support for:

```json
{
  "user": {
    "id": "number",
    "profile": {
      "name": "string"
    }
  }
}
```

and arrays of nested objects.

Potential internal representation:

```text
object
├── user: object
│   ├── id: number
│   └── profile: object
│       └── name: string
```

---

## Step 22 — Detect more breaking-change types

Current checker detects:

* missing fields
* unexpected fields
* wrong field types
* wrong top-level response type

Add:

* endpoint removed
* endpoint added
* HTTP method changed
* nested field removed
* nested field type changed
* array → object
* object → array
* nullable/non-nullable changes
* optional/required fields

---

## Step 23 — Analyze frontend API usage

This is a major feature.

Guardian should inspect:

```text
test-project/frontend/src/
```

and discover API calls such as:

```ts
fetch("/api/users")
```

or:

```ts
fetch("/api/users", {
  method: "GET"
})
```

and eventually Axios:

```ts
axios.get("/api/users")
```

The analyzer should determine:

```text
Frontend API usage
      ↓
GET /api/users
      ↓
Expected/used response fields
```

Then compare that against the backend/contract.

---

## Step 24 — Detect frontend/backend mismatch

Example:

Frontend expects:

```ts
type User = {
  id: number;
  name: string;
  email: string;
};
```

Backend returns:

```ts
{
  id: 1,
  username: "John",
  email: "john@example.com"
}
```

Guardian should report something like:

```text
✗ API contract violation

GET /api/users

Frontend expects:
  name: string

Backend provides:
  username: string

Potential breaking change:
  "name" is missing from the backend response.
```

This is closer to the actual product vision.

---

## Step 25 — Improve contract representation

Once the analyzer works well with our simple JSON format, evaluate moving toward a standard contract representation.

Potential direction:

```text
OpenAPI
   ↓
Contract
   ↓
Backend analysis
   ↓
Frontend analysis
   ↓
Compatibility checking
```

Don't do this until the basic analyzer is stable.

---

## Step 26 — Better CLI structure

Move from manual:

```ts
process.argv
```

parsing to a proper CLI structure only when necessary.

Eventually:

```bash
guardian analyze ./test-project
guardian check ./test-project
guardian init
guardian --help
guardian --version
```

Potentially introduce a CLI library such as Commander later.

Don't install one yet unless needed.

---

## Step 27 — Proper output/reporting

Improve output:

```text
API Contract Guardian

Analyzing: test-project

Found:
  APIs:       4
  Contracts:  4
  Frontend:   ✓
  Backend:    ✓

Results:

✓ GET /api/users
✓ GET /api/products

✗ POST /api/orders
  Missing field: total
  Type mismatch: id expected number, found string

────────────────────────────

2 passed
1 failed
```

---

## Step 28 — Exit codes

Implement:

```text
0 = all checks passed
1 = contract violations
2 = Guardian/analyzer error
```

This allows CI:

```bash
guardian analyze ./test-project
```

to fail a build when breaking API changes are detected.

---

## Step 29 — Configuration file

Eventually support something like:

```text
guardian.config.json
```

Example:

```json
{
  "backend": "./backend",
  "frontend": "./frontend",
  "contracts": "./contract"
}
```

This removes assumptions about directory names.

---

## Step 30 — Add proper test suite

Add tests for:

* route discovery
* AST parsing
* response analysis
* contract loading
* contract comparison
* frontend API discovery
* breaking changes
* valid changes
* malformed projects

Likely eventually use:

* Vitest or Jest

but don't add a testing framework until we're ready for this step.

---

## Step 31 — Create multiple test scenarios

The test project should eventually contain scenarios such as:

### Passing

```text
Backend == Contract == Frontend
```

### Missing field

```text
Contract expects:
name

Backend:
no name
```

### Unexpected field

```text
Backend:
username

Contract:
name
```

### Wrong type

```text
Contract:
id: number

Backend:
id: string
```

### Removed endpoint

```text
Contract:
GET /api/users

Backend:
no /api/users
```

### Frontend mismatch

```text
Frontend expects:
name

Backend provides:
username
```

These scenarios become regression tests for Guardian.

---

## Step 32 — CI/CD integration

Eventually demonstrate:

```text
Developer changes API
        ↓
Push / Pull Request
        ↓
CI runs Guardian
        ↓
guardian analyze .
        ↓
Contract mismatch?
       / \
     yes  no
      │    │
      ▼    ▼
  Fail CI  Pass
```

This is an important part of the project's real-world value.

---

## Step 33 — Package Guardian as an actual CLI

Eventually the project should be installable/run like:

```bash
npx api-contract-guardian analyze .
```

or:

```bash
npm install -g api-contract-guardian
guardian analyze .
```

This requires:

* proper package metadata
* `bin` entry in `package.json`
* build process
* compiled output
* versioning
* README documentation

Don't do this until the core analyzer is mature.

---

# 8. Final Intended Architecture

The eventual Guardian architecture should look roughly like:

```text
                         ┌──────────────────┐
                         │   Guardian CLI   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Project Scanner  │
                         └────────┬─────────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
          Backend AST        Frontend AST       Contract
               │                  │                  │
               ▼                  ▼                  ▼
        API Discovery       API Usage          Contract Loader
               │                  │                  │
               ▼                  ▼                  │
        Response Analysis   Response Usage            │
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  ▼
                       ┌────────────────────┐
                       │ Contract Checker   │
                       └─────────┬──────────┘
                                 │
                                 ▼
                         Compatibility Report
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
                  Terminal                CI/CD
                  output                   exit code
```

---

# 9. Current CLI

Currently run from the repository root:

```powershell
npm run guardian -- analyze ../test-project
```

Current successful behavior:

```text
Analyzing API Contracts for: ../test-project

Project structure:
  Frontend: found
  Backend:  found
  Contract: found

Contracts:
  GET /api/users

Discovered APIs:
  GET /api/users
    ✓ Contract matches backend response.
```

When the backend is intentionally changed from:

```ts
name: "John Doe"
```

to:

```ts
username: "John Doe"
```

Guardian detects:

```text
✗ Contract mismatch:
  - Missing field "name".
  - Unexpected field "username".
```

---

# 10. Important Implementation Rules for Continuing the Project

When continuing this project:

1. **Do not restart from scratch.**
2. Assume Steps 1–17 are already completed and working.
3. Do not replace working code unnecessarily.
4. Continue incrementally.
5. Give exact commands and exact file changes.
6. Explain briefly what each change accomplishes.
7. Test after each step before proceeding.
8. Keep the implementation simple before making it sophisticated.
9. Prefer TypeScript AST analysis over regex for source-code analysis.
10. Don't add dependencies unless there is a clear reason.
11. Don't introduce a CLI framework prematurely.
12. Don't jump to OpenAPI before the basic analyzer is robust.
13. The `test-project` is the controlled environment used to validate Guardian.
14. Deliberately introduce breaking changes into `test-project` to prove Guardian works.
15. Eventually restore the test project to its valid state after breaking-change tests.
16. The end goal is a credible developer tool, not merely a demo script.

---

# 11. Current Status

### Completed

* [x] Monorepo folder structure
* [x] Guardian Node project
* [x] TypeScript setup
* [x] `tsx` setup
* [x] Root npm command
* [x] Fake backend
* [x] Fake frontend
* [x] Frontend → backend API communication
* [x] CORS
* [x] Explicit API contract
* [x] Guardian CLI
* [x] Project path input
* [x] Project structure scanner
* [x] Backend API discovery
* [x] AST-based API discovery
* [x] AST-based simple response analysis
* [x] Contract loading
* [x] Contract comparison
* [x] Missing field detection
* [x] Unexpected field detection
* [x] Type mismatch foundation
* [x] Breaking-change demonstration

### Current step

**Step 17 completed.**

### Next immediate task

**Step 18 — Recursively scan the backend source tree instead of assuming everything lives in `backend/src/index.ts`.**

Do not jump directly to frontend analysis or OpenAPI. Build the backend analyzer in stages.

---

# 12. Immediate Next Implementation

The next conversation should begin with:

> "Step 17 is complete. Let's continue with Step 18: recursively scan the backend source tree so Guardian can analyze multiple TypeScript files instead of only backend/src/index.ts."

Then implement that incrementally.
