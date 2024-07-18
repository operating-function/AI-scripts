#!/usr/bin/env node

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import process from "process";
import { chat, MODELS, tokenCount } from './Chat.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const sire_guide = await fs.readFile(new URL('./SIRE_GUIDE_AI.md', import.meta.url), 'utf-8');


// System prompt for the AI model, defining its role and behavior
const system = `
You are SireCoder, a Sire coding assistant.

# USER INPUT

You will receive:

1. A target <FILE/> in the Sire language. That's the code you must update.

2. The user's change <REQUEST/>. You must perform that change on the target file.

# SIRECODER OUTPUT

You, SireCoder, must answer with a single <RESULT/> tag, which must include the
user's file, except *modified* to fulfill the user's request, and nothing else.

# GUIDE FOR NAVIGATING

In some cases, you WILL need additional context to fulfill a request. When that is the case, do NOT attempt to refactor the file immediately. Instead, ask for additional files inside <SHOW></SHOW> tags, as follows:

<SHOW>
[
  {"path": "./sire/kern.sire", "mode": "full"},
  {"path": "./README.md", "mode": "full"},
  {"path": "./sire/kern.sire", "mode": "exports"},
  {"path": "./sire/kern.sire", "mode": "definitions", "definitions": ["definitionOne", "definitionTwo"]}
]
</SHOW>

- Use the mode "exports" to get a list of all the names which a file exports.
- Use the mode "definitions" to get the definitions of a list of names, as well as any unit tests that reference them.
- Use the mode "full" if you need the whole file, or a list of directory contents.

When referencing chapters in the bootstrap sequence, most of the time you don't want the full file since it is very long. Instead you can request the
export list and then request the definitions that you're interested in.

You can ask for information as many times as you want.


# GUIDE FOR REFACTORING

1. Make ONLY the changes necessary to correctly fulfill the user's REQUEST.
2. Do NOT fix, remove, complete, or alter any parts unrelated to the REQUEST.
3. Do not include any additional comments, explanations, or text outside of the RESULT tags.
4. NEVER assume information you don't have. ALWAYS request files to make sure.
5. Preserve the same indentation and style of the target FILE.
6. Consult Sire's guide to emit syntactically correct code.
7. Be precise and careful in your modifications.

${sire_guide}

# SIRECODER EXAMPLE

Below is a complete example of how SireCoder should interact with the user.

## User:

<FILE path="/Users/v/vic/dev/pallas/sire/sandbox.sire">
; Copyright 2023 The Plunder Authors
; Use of this source code is governed by a BSD-style license that can be
; found in the LICENSE file.

#### sandbox <- kern

;;;;
;;;; This is a generic wrapper around a cog function, which validates that the
;;;; cog is only attempting to send reap/stop cog requests on cogs that it
;;;; started.
;;;;


;;; Imports ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

:| sire
:| kern
:| mutrec
:| stew


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

> Call a > Bit
= (isCogSpin r)
| ifNot | isRow r
    FALSE
| ifNot | eql %cog | idx 0 r
    FALSE
| eql %spin | idx 1 r

> Call a > Bit
= (isCogReapOrStop r)
| ifNot | isRow r
    FALSE
| ifNot | eql %cog | idx 0 r
    FALSE
| or (eql %reap (idx 1 r)) (eql %stop (idx 1 r))

> Row (Call a) > Tab Nat Any > Set Any
= (findNewCogids reqs resp)
| setFromRow
| listToRow
| listCatMaybes
: k < listForEach (findIdxMany isCogSpin reqs)
| tabLookup k resp

> Row (Call a) > Tab Nat Any > Set Any
= (findDeadCogids reqs resp)
| setFromRow
| listToRow
| listCatMaybes
: k < listForEach (findIdxMany isCogReapOrStop reqs)
'hole
</FILE>

<REQUEST>
lookup k in resp and case analyze the result
</REQUEST>

## SireCoder:

<SHOW>
[
  {"path": "./sire/sire_12_tab.sire", "mode": "exports"}
]
</SHOW>

## User:

<FILE path="./sire/sire_12_tab.sire" exports>
^-^
^-^ tabSing _MkTab isTab
^-^
^-^ tabSearchCase
^-^
^-^ tabLen tabIdx tabKeysSet tabKeysRow tabKeysList tabHas tabGet
^-^ tabValsRow tabValsList tabSwitch
^-^ tabFromPairs tabFromAscPairs tabToPairs tabToPairList tabToList tabPut
^-^ tabFromPairsList
^-^ tabIns tabIsEmpty tabDel tabPop tabSplitAt tabSplitLT tabAlter
^-^ tabMapWithKey tabMap
^-^ tabUnionWith tabUnion tabWeld tabCatRow
^-^ tabLookup tabMinKey tabFoldlWithKey tabElemIdx emptyTab tabInsWith
^-^ tabFilterWithKey
^-^
^-^ readRex
^-^
^-^ readTabPair readTabBracket readWideTabLit readTallTabLit
^-^ isTabSugar
^-^
^-^ tabE
^-^
^-^ {,} {#} {##}
^-^
</FILE>

## SireCoder:

<SHOW>
[
  {
    "path": "./sire/sire/sire_12_tab.sire",
    "mode": "definitions",
    "definitions": ["tabLookup"]
  }
]
</SHOW>

## User:

<FILE path="./sire/sire_12_tab.sire" definitions>
= (_TabIsEmpty tab) | null (_TabVals tab)
= (_TabHas k t)     | setHas k (_TabKeys t)
= (_TabLookup k t)  | if (_TabHas k t) (SOME | tabIdx k t) NONE

=?= NONE   | _TabLookup 3 | _MkTab [1 5] [5 1]
=?= SOME-1 | _TabLookup 3 | _MkTab [1 5] [5 1]

= tabLookup        | _TabLookup
= tabKeysSet       | _TabKeys
= tabKeysRow       | _TabKeysRow
= tabKeysList      | _TabKeysList
= tabValsRow       | _TabVals
= tabHas           | _TabHas
= tabLen           | _TabLen
= tabIsEmpty       | _TabIsEmpty
= tabFilterWithKey | _TabFilterWithKey
</FILE>

## SireCoder:

<RESULT>
; Copyright 2023 The Plunder Authors
; Use of this source code is governed by a BSD-style license that can be
; found in the LICENSE file.

#### sandbox <- kern

;;;;
;;;; This is a generic wrapper around a cog function, which validates that the
;;;; cog is only attempting to send reap/stop cog requests on cogs that it
;;;; started.
;;;;


;;; Imports ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

:| sire
:| kern
:| mutrec
:| stew


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

> Call a > Bit
= (isCogSpin r)
| ifNot | isRow r
    FALSE
| ifNot | eql %cog | idx 0 r
    FALSE
| eql %spin | idx 1 r

> Call a > Bit
= (isCogReapOrStop r)
| ifNot | isRow r
    FALSE
| ifNot | eql %cog | idx 0 r
    FALSE
| or (eql %reap (idx 1 r)) (eql %stop (idx 1 r))

> Row (Call a) > Tab Nat Any > Set Any
= (findNewCogids reqs resp)
| setFromRow
| listToRow
| listCatMaybes
: k < listForEach (findIdxMany isCogSpin reqs)
| tabLookup k resp

> Row (Call a) > Tab Nat Any > Set Any
= (findDeadCogids reqs resp)
| setFromRow
| listToRow
| listCatMaybes
: k < listForEach (findIdxMany isCogReapOrStop reqs)
# datacase | tabLookup k resp
* NONE     'resp_is_none
* (SOME r) 'resp_is_some
</RESULT>

# EXPLANATION

## Input:

The user provided a target file (sandbox.sire) to be modified, and a request:
"lookup k in resp and case analyze the result". The target file had an
incomplete top-level definition, \`findDeadCogids\`, with a quoted symbol
\`'hole\`, as its body.

## Output:

As a response, you, SireCoder, consulted the file in the bootstrapping sequence
that concerns tabs, since \`resp\` is a tab. Based on its export list, you knew
to request the definition of the \`tabLookup\` function, and based on this, you
constructed a type-appropriate lookup expression, and put that in a #datacase.
You did NOT perform any extra work, nor change anything beyond what the user
explicitly asked for. Instead, you just placed NEW quoted symbols
(\`'resp_is_none\`/\`'resp_is_some\`) on the respective cases. You included the
updated file inside a RESULT tag, completing the task successfully. Good job!

# TASK

The user will now give you a Sire file, and a change request. Read it carefully
and update it as demanded. Consult the guides above as necessary. Pay attention
to syntax details, like mandatory parenthesis, to emit valid code. Do it now:
`.trim();

// Main function to handle the refactoring process
async function main() {
  // Check for correct usage and parse command-line arguments
  if (process.argv.length < 3) {
    console.log("Usage: refactor <file> <request> [<model>] [--check]");
    process.exit(1);
  }

  const file = process.argv[2];
  const request = process.argv[3];
  const model = process.argv[4] || "s";
  const check = process.argv.includes("--check");

  // Initialize the chat function with the specified model
  const ask = chat(model);

  // Get directory and file information
  const fileContent = await fs.readFile(file, 'utf-8');
  const dirContent = await fs.readdir(path.dirname(file));
  const depsContent = await readDependencies(file);

  // Prepare initial input for the AI
  let aiInput =
//    `<DIR path="${dir}" current>\n${dirContent.join('\n')}\n</DIR>\n\n` +
    depsContent +
    `\n\n<FILE path="${file}" current>\n${fileContent}\n</FILE>` +
    `\n\n<REQUEST>\n${request}\n</REQUEST>`;

  // If --check flag is present, perform initial type check
  if (check) {
    const initialCheck = await typeCheck(file);
    aiInput += `\n\n<CHECK>\n${initialCheck || 'No errors.'}\n</CHECK>`;
  }

  // Main interaction loop with the AI
  while (true) {
    console.log("");
    console.log("=== SENDING PROMPT ===");
    console.log(system);
    console.log(aiInput);
    console.log("=== END PROMPT ===");

    const aiOutput = await ask(aiInput, { system, model });
    
    // Handle AI's request for additional information
    if (aiOutput.includes("<SHOW>")) {
      const showMatch = aiOutput.match(/<SHOW>\s*([\s\S]*?)\s*<\/SHOW>/);
      if (showMatch) {
        const filesToShow = JSON.parse(showMatch[1]);
        let showContent = "";
        for (const fileRequest of filesToShow) {
          const fullPath = path.resolve(dir, fileRequest.path);
          
          if (await fs.stat(fullPath).then(stat => stat.isDirectory())) {
            const dirContent = await fs.readdir(fullPath);
            showContent += `<DIR path="${fullPath}">\n${dirContent.join('\n')}\n</DIR>\n`;
          } else {
            let content;
            switch (fileRequest.mode) {
              case 'full':
                content = await fs.readFile(fullPath, 'utf-8');
                break;
              case 'exports':
                const exportsRegex = /^\^-\^.*$/gm;
                content = await grepFile(fullPath, exportsRegex);
                break;
              case 'definitions':
                const definitionsRegex = fileRequest.definitions.map(def => 
                  new RegExp(`(?:^|\\n\\n)(?:(?:(?:>.*\\n)*)?(?:=\\s*(?:${def}|_${def[0].toUpperCase() + def.slice(1)})\\b|(?:=\\s*\\([^)]*\\b(?:${def}|_${def[0].toUpperCase() + def.slice(1)})\\b[^)]*\\))|(?:(?:${def}|_${def[0].toUpperCase() + def.slice(1)})\\s*=)|(?:.*(?:${def}|_${def[0].toUpperCase() + def.slice(1)}).*(?:=\\?=|!!)))(?:[^\\n]*\\n?)+)(?=\\n\\n|$)`, 'gm')
                );
                content = await grepDefinitions(fullPath, definitionsRegex);
                break;
            }
            showContent += `<FILE path="${fullPath}" mode="${fileRequest.mode}">\n${content}\n</FILE>\n`;
          }
        }
        aiInput = showContent;
      }
    }

    // Handle AI's refactoring result
    else if (aiOutput.includes("<RESULT>")) {
      const resultMatch = aiOutput.match(/<RESULT>([\s\S]*?)<\/RESULT>/);
      if (resultMatch) {
        const newContent = resultMatch[1];
        await fs.writeFile(file, newContent.trim(), 'utf-8');
        console.log("\nFile refactored successfully.");
        
        // If --check flag is present, perform type check on the refactored file
        if (check) {
          const checkResult = await typeCheck(file);
          if (checkResult) {
            aiInput = `<FILE path="${file}" current>\n${newContent.trim()}\n</FILE>\n\n<REQUEST>\nFix this file.\n</REQUEST>\n\n<CHECK>\n${checkResult}\n</CHECK>`;
            continue;
          }
        }
        break;
      }
    }
  }
}

// Function to perform type checking based on file extension
async function typeCheck(file) {
  const ext = path.extname(file);
  let cmd;
  switch (ext) {
    case '.agda':
      cmd = `agda-check ${file}`;
      break;
    case '.kind2':
      cmd = `kind2 check ${file}`;
      break;
    case '.c':
      cmd = `gcc -fsyntax-only ${file}`;
      break;
    case '.ts':
      cmd = `tsc --noEmit ${file}`;
      break;
    case '.hs':
      cmd = `ghc -fno-code ${file}`;
      break;
    default:
      return null;
  }
  
  try {
    var result = await execAsync(cmd);
    return result.stderr || result.stdout;
  } catch (error) {
    return error.stderr;
  }
}

function parseDeps(fileContent) {
  const excludeFiles = ['sire.sire', 'quickcheck.sire'];

  return fileContent
    .split('\n')
    .filter(line => line.startsWith(':| '))
    .map(line => line.slice(3).trim() + '.sire')
    .filter(dep => !excludeFiles.includes(dep));
}

async function readDependencies(file) {
  const fileContent = await fs.readFile(file, 'utf-8');
  const deps = parseDeps(fileContent);
  const dir = path.dirname(file);
  
  const depsContent = await Promise.all(
    deps.map(async (dep) => {
      const content = await fs.readFile(path.join(dir, dep), 'utf-8');
      return `<FILE path="${dep}">\n${content.trim()}\n</FILE>`;
    })
  );
  
  return depsContent.join('\n\n');
}

async function grepFile(filePath, regex) {
  return new Promise((resolve, reject) => {
    const result = [];
    readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    }).on('line', (line) => {
      if (regex.test(line)) {
        result.push(line);
      }
    }).on('close', () => {
      resolve(result.join('\n'));
    }).on('error', reject);
  });
}

async function grepDefinitions(filePath, regexArray) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let result = '';
  for (const regex of regexArray) {
    const matches = fileContent.match(regex);
    if (matches) {
      result += matches.join('\n\n') + '\n\n';
    }
  }
  return result.trim();
}

// Run the main function and handle any errors
main().catch(console.error);
