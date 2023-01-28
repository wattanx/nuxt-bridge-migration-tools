import { parse } from "@vue/compiler-sfc";
import { readFile } from "fs/promises";

export const convertTargetFiles = async (targetFilePaths: string[]) => {
  const allFiles = await Promise.all(
    targetFilePaths.map(async (path) => {
      const fullText = await readFile(path, "utf8");
      const descriptor = parse(fullText).descriptor;
      const script = descriptor.script?.content ?? "";
      const lang = descriptor.script?.lang ?? "js";
      return {
        path,
        fullText,
        script,
        lang,
      };
    })
  );

  const targetFiles = allFiles.filter((file) => file.script !== "");
  return targetFiles;
};
