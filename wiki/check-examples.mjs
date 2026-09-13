// Compile and execute the standalone Java examples that readers copy from the WIKI.
import {readFile, readdir, mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {javaDiagramOracle} from './diagram-cases.mjs';
import {towerModels,javaTowerOracle} from './check-tower.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const repository = path.resolve(root, '..');
const checks = path.join(root, '.checks');
const windows = process.platform === 'win32';

function checkedProcess(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: repository, encoding: 'utf8', shell: false, windowsHide: true,
    timeout: 60000, maxBuffer: 8 * 1024 * 1024, ...options
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${path.basename(executable)} failed${result.signal ? ` (${result.signal})` : ''}:\n${result.error || ''}\n${result.stdout || ''}${result.stderr || ''}`);
  }
  return result.stdout.trim();
}

function runMaven(args) {
  const executable = process.env.MAVEN_EXECUTABLE || (windows ? 'mvn.cmd' : 'mvn');
  if (process.env.MAVEN_REPO_LOCAL) args.push(`-Dmaven.repo.local=${path.resolve(process.env.MAVEN_REPO_LOCAL)}`);
  if (!windows || !/\.(?:cmd|bat)$/i.test(executable)) {
    return checkedProcess(executable, args, {timeout: 300000});
  }

  // Windows batch files need a command interpreter. Keep its program static and
  // pass executable/arguments as environment data, never interpolated shell code.
  // Reject cmd.exe expansion/control characters before PowerShell invokes the batch file.
  if ([executable, ...args].some(value => /[\r\n"%!^&|<>]/.test(value))) {
    throw new Error('Maven executable and paths must not contain Windows command expansion/control characters (" % ! ^ & | < > or newlines).');
  }
  const powershell = process.env.SystemRoot
    ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : 'powershell.exe';
  return checkedProcess(powershell, [
    '-NoProfile', '-NonInteractive', '-Command',
    '$ErrorActionPreference = "Stop"; $taskArguments = @(ConvertFrom-Json $env:ASHNAV_WIKI_MAVEN_ARGUMENTS); & $env:ASHNAV_WIKI_MAVEN_EXECUTABLE @taskArguments; exit $LASTEXITCODE'
  ], {
    timeout: 300000,
    env: {...process.env, ASHNAV_WIKI_MAVEN_EXECUTABLE: executable, ASHNAV_WIKI_MAVEN_ARGUMENTS: JSON.stringify(args)}
  });
}

const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g,
  (_, entity) => ({amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'"}[entity]));

async function readExamples() {
  const context = vm.createContext({window: {}});
  const shell = await readFile(path.join(root, 'index.html'), 'utf8');
  for (const [, file] of shell.matchAll(/<script src="\.\/(content\/[^" ]+)"/g)) {
    vm.runInContext(await readFile(path.join(root, file), 'utf8'), context, {filename: file, timeout: 1000});
  }
  if (!Array.isArray(context.window.WIKI_PAGES) || !context.window.WIKI_PAGES.length) {
    throw new Error('Expected a non-empty WIKI_PAGES array.');
  }

  const examples = new Map();
  const filenames = new Map();
  let fragments = 0;
  for (const page of context.window.WIKI_PAGES) {
    const html = [page.intro || '', ...page.sections.map(section => section.html)].join('\n');
    for (const [, attributes, escaped] of html.matchAll(/<div\b([^>]*)>\s*<pre><code>([\s\S]*?)<\/code><\/pre>\s*<\/div>/g)) {
      if (!/\bclass="[^"]*\bcode-block\b/.test(attributes) || !/\bdata-language="java"/.test(attributes)) continue;
      const source = decode(escaped).replace(/\r\n/g, '\n').trim();
      const name = source.match(/\bpublic\s+(?:final\s+)?class\s+([A-Za-z_$][\w$]*)\b/)?.[1];
      if (!name || !/\bpublic\s+static\s+void\s+main\s*\(/.test(source)) {
        fragments++;
        continue;
      }
      const filename = decode(attributes.match(/\bdata-filename="([^"]*)"/)?.[1] || '');
      if (filename !== `${name}.java`) {
        throw new Error(`${page.id}: standalone class ${name} needs the filename ${name}.java, received ${filename || '(missing)'}.`);
      }
      const packageName = source.match(/^\s*package\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/m)?.[1] || '';
      const className = packageName ? `${packageName}.${name}` : name;
      const previous = examples.get(className) || filenames.get(filename);
      if (previous) {
        if (previous.source !== source || previous.filename !== filename || previous.className !== className) {
          throw new Error(`Conflicting standalone Java examples for ${filename}: ${previous.pages.join(', ')} and ${page.id}.`);
        }
        previous.pages.push(page.id);
        continue;
      }
      const example = {name, className, packageName, filename, source, pages: [page.id]};
      examples.set(className, example);
      filenames.set(filename, example);
    }
  }
  if (!examples.size) throw new Error('No standalone Java examples with public static void main were found.');
  return {examples: [...examples.values()], fragments};
}

async function javaFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await javaFiles(file));
    else if (entry.name.endsWith('.java')) files.push(file);
  }
  return files.sort();
}

const javaExecutable = name => process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', name + (windows ? '.exe' : ''))
  : name;
const quoteJavaArgument = value => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

async function main() {
  const {examples, fragments} = await readExamples();
  const authoredCount=examples.length;
  const models=vm.createContext({window:{}});
  vm.runInContext(await readFile(path.join(root,'assets/diagram-models.js'),'utf8'),models);
  const M=models.window.ASHNAV_MODELS;
  for(const [i,algorithm] of ['BFS','Dijkstra','A*'].entries()) {
    const scene=M.presets.warehouse,g=M.grid(7,1,5,scene.blocked,'N18',scene.entry),name=`WarehouseExport${i}`;
    examples.push({name,className:name,packageName:'',filename:`${name}.java`,source:M.javaGraph(g,g.node(0,0,2),g.node(6,0,2),algorithm,name),pages:['generated scene export']});
  }
  examples.push({name:'WikiDiagramOracle',className:'WikiDiagramOracle',packageName:'',filename:'WikiDiagramOracle.java',source:javaDiagramOracle(models.window.ASHNAV_MODELS),pages:['interactive visualizations']});
  examples.push({name:'WikiTowerOracle',className:'WikiTowerOracle',packageName:'',filename:'WikiTowerOracle.java',source:javaTowerOracle(await towerModels()),pages:['3D tower visualization']});
  await mkdir(checks, {recursive: true});
  const classpathFile = path.join(checks, 'classpath.txt');
  console.log('Resolving the compile dependencies declared by pom.xml…');
  runMaven([
    '-B', '-ntp', '-f', path.join(repository, 'pom.xml'), 'dependency:build-classpath',
    '-DincludeScope=compile', `-Dmdep.outputFile=${classpathFile}`, '-Dmdep.regenerateFile=true'
  ]);
  const dependencies = (await readFile(classpathFile, 'utf8')).trim();
  if (!dependencies) throw new Error('Maven returned an empty compile classpath.');

  const work = await mkdtemp(path.join(checks, 'examples-'));
  const classes = path.join(work, 'classes');
  await mkdir(classes);
  for (const example of examples) {
    const directory = path.join(work, 'sources', ...example.packageName.split('.').filter(Boolean));
    await mkdir(directory, {recursive: true});
    example.file = path.join(directory, example.filename);
    await writeFile(example.file, example.source + '\n');
  }
  const sources = [...await javaFiles(path.join(repository, 'src/main/java')), ...examples.map(example => example.file)];
  const argsFile = path.join(work, 'javac.args');
  await writeFile(argsFile, ['--release', '21', '-encoding', 'UTF-8', '-classpath', dependencies, '-d', classes, ...sources]
    .map(quoteJavaArgument).join('\n') + '\n');
  checkedProcess(javaExecutable('javac'), [`@${argsFile}`]);
  const classpath = [classes, dependencies].join(path.delimiter);
  for (const example of examples) {
    const output = checkedProcess(javaExecutable('java'), ['-ea', '-cp', classpath, example.className]);
    console.log(`PASS ${example.pages.join(', ')}: ${example.filename}${output ? `\n${output}` : ''}`);
  }
  console.log(`Compiled current Ashnav source and ran ${authoredCount} standalone WIKI examples, 3 generated Java exports, and both visualization oracles with assertions enabled. ${fragments} Java fragment(s) are not standalone programs.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
