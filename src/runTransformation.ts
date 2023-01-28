import jscodeshift, { Transform, Parser } from "jscodeshift";
// @ts-ignore
import getParser from "jscodeshift/src/getParser";

import { parse, SFCDescriptor } from "@vue/compiler-sfc";
import { stringify } from "./lib/stringifySFC";

type FileInfo = {
  path: string;
  source: string;
};

type JSTransformation = Transform & {
  parser?: string | Parser;
};

type JSTransformationModule =
  | JSTransformation
  | {
      default: Transform;
      parser?: string | Parser;
    };

type TransformationModule = JSTransformationModule;

export default function runTransformation(
  fileInfo: FileInfo,
  transformationModule: TransformationModule,
  params: object = {}
) {
  let transformation: JSTransformation;
  // @ts-ignore
  if (typeof transformationModule.default !== "undefined") {
    // @ts-ignore
    transformation = transformationModule.default;
  } else {
    // @ts-ignore
    transformation = transformationModule;
  }

  const { path, source } = fileInfo;
  const extension = (/\.([^.]*)$/.exec(path) || [])[0];
  // @ts-ignore
  let lang = extension.slice(1);

  let descriptor: SFCDescriptor;
  if (extension === ".vue") {
    descriptor = parse(source, { filename: path }).descriptor;

    // skip .vue files without script block
    if (!descriptor.script) {
      return source;
    }

    lang = descriptor.script.lang || "js";
    fileInfo.source = descriptor.script.content;
  }

  let parser = getParser();
  let parserOption = (transformationModule as JSTransformationModule).parser;
  // force inject `parser` option for .tsx? files, unless the module specifies a custom implementation
  if (typeof parserOption !== "object") {
    if (lang.startsWith("ts")) {
      parserOption = lang;
    }
  }

  if (parserOption) {
    parser =
      typeof parserOption === "string" ? getParser(parserOption) : parserOption;
  }

  const j = jscodeshift.withParser(parser);
  const api = {
    j,
    jscodeshift: j,
    stats: () => {},
    report: () => {},
  };

  const out = transformation(fileInfo, api, params);
  if (!out) {
    return source;
  }

  if (extension === ".vue") {
    if (out === descriptor!.script!.content) {
      return source;
    }

    descriptor!.script!.content = out;
    return stringify(descriptor!);
  }

  return out;
}
