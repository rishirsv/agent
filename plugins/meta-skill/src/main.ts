#!/usr/bin/env node
import { runCommand } from "./commands.ts";
import { CliError } from "./project.ts";

runCommand(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    if (error instanceof CliError) {
      console.error(`error: ${error.message}`);
      process.exitCode = error.exitCode;
      return;
    }
    console.error(error instanceof Error ? `error: ${error.message}` : String(error));
    process.exitCode = 1;
  });
