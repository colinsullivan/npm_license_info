#!/usr/bin/env node

const fs = require('fs');
const util = require('util');
const path = require('path');
//const legally = require('legally');
const NpmApi = require('npm-api');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const npm = new NpmApi();

const createOutputEntry = (
  package,
  isDevDependency,
) => {
  const { name, homepage, license } = package;

  const modified = "?";
  const distributed = isDevDependency === false;

  return [name, license, homepage, modified, distributed];
}


const main = async function (argv) {

  const outputList = [];

  const project_dir = argv[2];
  const packageJson = JSON.parse(await readFile(path.join(project_dir, 'package.json'), 'utf8'));
  
  const dependencies = packageJson.dependencies;
  const devDependencies = packageJson.devDependencies;

  for (const packageName of Object.keys(dependencies)) {
    const repo = npm.repo(packageName);
    const package = await repo.package();

    outputList.push(createOutputEntry(package, false));
  }

  for (const packageName of Object.keys(devDependencies)) {
    const repo = npm.repo(packageName);
    const package = await repo.package();

    outputList.push(createOutputEntry(package, true));
  }

  const outputCSVString = outputList.reduce((acc, curr) => acc += `\n${curr.join(",")}`, "");
  
  const outputCSVFilename = "licenseInfo.csv";
  console.log(`Writing output to ${outputCSVFilename}...`);
  await writeFile(outputCSVFilename, outputCSVString);
};

main(process.argv).catch(console.error);
