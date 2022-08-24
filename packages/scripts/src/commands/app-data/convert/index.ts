import * as fs from "fs-extra";
import { Command } from "commander";

import * as path from "path";
import chalk from "chalk";
import { FlowTypes } from "data-models";
import { getActiveDeployment } from "../../deployment/get";
import { IConverterPaths, IParsedWorkbookData } from "./types";
import { createChildLogger, logSheetsSummary, throwTemplateParseError } from "./logging";
import { XLSXWorkbookProcessor } from "./processors/xlsxWorkbook";
import { JsonFileCache } from "./cacheStrategy/jsonFile";
import { generateFolderFlatMap, IContentsEntry } from "./utils";
import { FlowParserProcessor } from "./processors/flowParser";

/***************************************************************************************
 * CLI
 * @example yarn
 *************************************************************************************/
const program = new Command("convert");
interface IProgramOptions {
  skipCache?: boolean;
  cacheFolder?: string;
  inputFolder?: string;
  outputFolder?: string;
}
export default program
  .description("Convert app data")
  .option("-i --input-folder <string>", "")
  .option("-s --skip-cache", "Wipe local conversion cache and process all files")
  .option("-c --cache-folder <string>", "")
  .option("-o --output-folder <string>", "")
  .action(async (options: IProgramOptions) => {
    await new AppDataConverter(options).run();
  });

/***************************************************************************************
 * Main Methods
 *************************************************************************************/

/**
 * The AppDataConverter handles the process of converting xlsx workbooks to json
 * and then parsing as data flows
 *
 * TODO - can likely also be an extension of the base converter (?)
 */
export class AppDataConverter {
  /** Change version to invalidate all underlying caches */
  public version = 20220823.0;

  public activeDeployment = getActiveDeployment();

  private paths: IConverterPaths = {
    SHEETS_INPUT_FOLDER: "",
    SHEETS_CACHE_FOLDER: "",
    SHEETS_OUTPUT_FOLDER: "",
  };

  public logger = createChildLogger({});

  cache: JsonFileCache;

  constructor(private options: IProgramOptions, testOverrides: Partial<AppDataConverter> = {}) {
    // optional overrides, used for tests
    if (testOverrides.version) this.version = testOverrides.version;
    if (testOverrides.activeDeployment) this.activeDeployment = testOverrides.activeDeployment;

    console.log(chalk.yellow("App Data Convert"));
    // Setup Folders
    const { inputFolder, outputFolder, cacheFolder } = options;
    const { app_data, _workspace_path } = this.activeDeployment;
    const SHEETS_CACHE_FOLDER = app_data.converter_cache_path;
    this.paths = {
      SHEETS_INPUT_FOLDER: inputFolder || path.resolve(_workspace_path, "app_data", "sheets"),
      SHEETS_CACHE_FOLDER: cacheFolder || path.resolve(SHEETS_CACHE_FOLDER, "individual"),
      SHEETS_OUTPUT_FOLDER: outputFolder || path.resolve(SHEETS_CACHE_FOLDER, "converted"),
    };
    Object.values(this.paths).forEach((p) => fs.ensureDir(p));
    if (this.options.skipCache) {
      this.cache.clear();
    }
    // Create a cache that can be used to invalidate all underlying processor caches
    this.cache = new JsonFileCache(this.paths.SHEETS_CACHE_FOLDER, this.version);
  }

  /**
   * Reads xlsx files from gdrive-download output and converts to json
   * objects representing sheet names and data values
   */
  public async run() {
    const processPipeline: {
      name: string;
      description: string;
      fn: (context: any) => Promise<any>;
    }[] = [
      {
        name: "xlsx_read",
        description: "Load list of all input xlsx workbooks from folder",
        fn: async () => {
          const filterFn = (relativePath: string) => relativePath.endsWith(".xlsx");
          return generateFolderFlatMap(this.paths.SHEETS_INPUT_FOLDER, true, filterFn);
        },
      },
      {
        name: "xlsx_convert",
        description: "Convert all xlsx workbooks to json arrays",
        fn: async (list: { [key: string]: IContentsEntry }) => {
          const xlsxConverter = new XLSXWorkbookProcessor(this.paths);
          return xlsxConverter.process(Object.values(list));
        },
      },
      {
        name: "jsons_clean",
        description: "Flatten json arrays to single list of all sheets, filter and sort",
        fn: async (data: FlowTypes.FlowTypeWithData[][]) => this.cleanFlowOutputs(data),
      },
      {
        name: "flows_process",
        description: "Apply specific parsers for flowtypes",
        fn: async (data: FlowTypes.FlowTypeWithData[]) => {
          const processor = new FlowParserProcessor(this.paths);
          return processor.process(data);
        },
      },
    ];
    let input: any;
    let output: any;
    for (const step of processPipeline) {
      output = await step.fn(input);
      this.logger.debug(step.name, output);
      input = output;
    }
    const result = output as IParsedWorkbookData;
    this.writeOutputJsons(result);
    logSheetsSummary(result);
    // logSheetErrorSummary(this.conversionWarnings, this.conversionErrors);
    console.log(chalk.yellow("Conversion Complete"));
    return result;
  }

  private cleanFlowOutputs(data: FlowTypes.FlowTypeWithData[][]) {
    // concat array or arrays to single array
    const flattened: FlowTypes.FlowTypeWithData[] = [].concat.apply([], data);
    // filter undefined, non-released and according to deployment filter
    const { sheets_filter_function } = this.activeDeployment.app_data;
    const filtered = flattened
      .filter((flow) => flow.status === "released")
      .filter((flow) => sheets_filter_function(flow as any));
    // sort by flow type and so that data pipes are processed last (depend on other lists)
    const sorted = filtered.sort((a, b) => {
      if (b.flow_type === ("data_pipe" as any)) return 1;
      return a.flow_type > b.flow_type ? 1 : -1;
    });
    return sorted;
  }

  /** Write individual converted jsons to flow_type folders */
  private writeOutputJsons(data: IParsedWorkbookData) {
    const outputBase = this.paths.SHEETS_OUTPUT_FOLDER;
    fs.ensureDirSync(outputBase);
    fs.emptyDirSync(outputBase);
    Object.values(data).forEach((flowArray) => {
      Object.values(flowArray).forEach((flow) => {
        const { flow_type, flow_name, flow_subtype } = flow;
        const flowOutputPath = path.resolve(
          outputBase,
          flow_type,
          flow_subtype || "",
          `${flow_name}.json`
        );
        // TODO - track error if output path already exists (duplicate name)
        fs.ensureDirSync(path.dirname(flowOutputPath));
        fs.writeFileSync(flowOutputPath, JSON.stringify(flow, null, 2));
        // TODO - statsync
      });
    });
  }
}
