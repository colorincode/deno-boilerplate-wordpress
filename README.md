# Deno Web Development Build Tool

## Features

This is a static site builder that relies on the deno runtime. These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 
<br />
**This is pre-release software &amp; we do not consider this production-ready, use at your own risk.**
<br />
Intent:
- start a local live server quickly
- production minification
    - JS/TS minification
    - CSS/SCSS minifiction
    - console.log removal
    - comment stripping
- compile SCSS (may be removed in the future)
- compile TS into JS, supports live TS editing

## Installation

### Prerequisites
On Windows and Linux machines, visual studio dev tools or a similar C++ object oriented environment to your machine, if not already present. You may want to change package managers based on project needs. This is really up to you, but it is recommended to install these at a root/machine level so you can switch package managers more easily and have them easily accessible. It may help to have a package VERSION manager onboard as well, though this is not required to build. This boilerplate uses JSR and npm, if you have a typical install of node/npm it should be sufficient. 
<br/>Here are useful tools: 
<br/>
[npmjs](https://www.npmjs.com/) <br/> 
[pnpm](https://pnpm.io/) <br/> 
[nvm](https://github.com/nvm-sh/nvm) <br/> 
[npx](https://docs.npmjs.com/cli/v7/commands/npx) <br/> 

> Ensure you have [node &amp; npm](https://nodejs.org/en):

Check your version after installation: <br/>
``node --version``
<br/>

``npm --version``
<br/>

> Install [Deno](https://deno.com/) runtime onto your system.

#### Mac/Linux (bash)

``curl -fsSL https://deno.land/install.sh | sh``

#### Windows (powershell)
```irm https://deno.land/install.ps1 | iex```

Verify the installation:

``deno --version``

Install the dependencies for this project from deno json: 
<br/>

`` deno install ``
<br/>

☝️ You may encounter permissions and prompts during install, deno does not enable all by default. 

## Getting Started
>Once your deno runtime is running, you can compile this project. For all tasks and commands, you can reference deno.json, but here are the basic commands:

Initial compilation, build src into dist and get a local instance running:

``deno task dev``

Production build, which should minify, chunk, split code in addition to dev tasks:

``deno task prod``

Once and a while, you may want to clear the 'dist' and 'prod' directories, so it is useful to run a clean command first:

``deno task clean``

After you run "deno task dev" or "deno task prod" successfully, you should see a "dist" or "prod" folder, as well as output on the console letting you know where your server has started. Most errors will log to the console and tend to be file location or dependency related. 

## File structure and project root directory 📁

The file structure is fairly simplistic, but it is important to keep a similar scaffolding since changing this could cause the project to compile incorrectly or fail to build, so this is a reference point of the working scaffolding, be sure to update "dev.ts" "prod.ts" and all "transform*.ts" files if you change file/folder locations within this project. 

**Your app root folder should contain the following dot files, which should stay in the root:**

dot/env files:

>deno.json | deno.lock | tsconfig.json | sharp.config.json | .browserslistrc | .gitignore | postcss.config.js 

compilation files:

>clear.ts | config.ts | dev.ts | prod.ts | transformAssets.ts | transformHTML.ts | transformJS.ts | transformSCSS.ts


### Scaffolding 

**Your app scaffolding structure should look like:**

Generally you want to separate concerns and nest your components inside the TS and SCSS folders, if you add different folders, templating, frameworks you will want to expand this boilerplate to include those. When you run "deno task dev" or "deno task prod" you should see the SCSS compile into CSS, and TS into JS. This boilerplate utilizes partial HTML files, which follow similar patterns as includes &amp; templates in other languages. 
~~~
|_dist 
|_src
    |_partials (if using)
        |_header.html
        |_footer.html
        |_grid-layout-helper.html
    |_scss
        |_helpers.scss
        |_ _mixins.scss | _resets.scss | _colors.scss | partial scss
        |_style.scss
    |_ts
    index.html
|_working-files
~~~

## Changelog and Latest Updates 🔔

### 08-10-2025 (v.0.0.2) (breaking changes):

- Stripped out biome linting to favor another
- Added speed and performance enhancements to build
- Added in basic deno workflow task to github (may need additional config)
- Tweaked dino animation
- Improved initial and subsequent build times
- Improved workflow for dev.ts, improved compile times for transforming files and assets

## Rough Roadmap/TODO:

- Add back in new linter , adjust minification (if needed) for TS/SCSS, one for production and one for src code. 
- Add in concurrency pool / memory allocation 
- Transform assets with streams API and piped streams
- improve processImage_utils and processVideo_utils
- add upgrade to websocket so it fails less
- deno cron jobs and subprocess running files (by spawning/subprocess output)
- hashing , base64 encoding
- add gzipped to prod builds
- add tests 
