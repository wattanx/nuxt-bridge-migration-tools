import { DEFAULT_OPTIONS } from "../lib/constants";
import type { Arguments, Argv } from "yargs";
import { capiHanler } from "../handlers/capi-handler";
import { green } from "colorette";

type Options = {
  targetFilePaths: string[];
  tsconfigPath: string;
};

export const command = "capi [targetFilePaths...]";
export const desc = "Convert '@nuxtjs/composition-api'.";

export const builder = (yargs: Argv<Options>): Argv<Options> =>
  yargs.options(DEFAULT_OPTIONS).positional("targetFilePaths", {
    array: true,
    type: "string",
    demandOption: true,
    description:
      "Path to the target vue file, which can be set with the glob pattern. eg: 'src/**/*.vue'",
  } as const);

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { targetFilePaths, tsconfigPath } = argv;
  const { convertedCount } = await capiHanler(targetFilePaths, tsconfigPath);

  console.log("\nCompleted 🎉");
  console.log(`${green(convertedCount)} files changed.`);
};
