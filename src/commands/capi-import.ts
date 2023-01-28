import { DEFAULT_OPTIONS } from "../lib/constants";
import type { Arguments, Argv } from "yargs";
import { capiHanler } from "../handlers/capi-handler";
import { green } from "colorette";
import fs from "fs";
import { runTransformation } from "vue-codemod";
import capiImport from "../transformations/capi-import";
import { generateProgressBar } from "../lib/generateProgressBar";

type Options = {
  targetFilePaths: string[];
  tsconfigPath: string;
};

export const command = "capi-import [targetFilePaths...]";
export const desc = "Convert import '@nuxtjs/composition-api'.";

export const builder = (yargs: Argv<Options>): Argv<Options> =>
  yargs.options(DEFAULT_OPTIONS).positional("targetFilePaths", {
    array: true,
    type: "string",
    demandOption: true,
    description:
      "Path to the target vue file, which can be set with the glob pattern. eg: 'src/**/*.vue'",
  } as const);

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  console.time("executionTime");
  const { targetFilePaths } = argv;
  const progressBar = generateProgressBar(green);
  progressBar.start(targetFilePaths.length, 0);

  let convertedCount = 0;
  for (const p of targetFilePaths) {
    const fileInfo = {
      path: p,
      source: fs.readFileSync(p).toString(),
    };
    try {
      const result = runTransformation(fileInfo, capiImport, {});
      fs.writeFileSync(p, result);
      convertedCount += 1;
      progressBar.increment();
    } catch (e) {
      console.error(e);
    }
  }
  progressBar.stop();
  console.timeEnd("executionTime");

  console.log("\nCompleted 🎉");
  console.log(`${green(convertedCount)} files changed.`);
};
