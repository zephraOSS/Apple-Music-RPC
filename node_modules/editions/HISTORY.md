# History

## v6.1.0 2020 October 29

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v6.0.0 2020 October 29

-   Changed semver dependency from `semver` to [`version-range`](https://github.com/bevry/version-range) which is faster, simpler, and supports Deno, completing our Deno compatibility
    -   While the simplicity of `version-range` does remove support for advanced ranges, it should cover all ranges that are used within editions
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v5.0.0 2020 October 27

-   Changed engines from Node.js version `>=0.8` to `>=4` as Node.js versions prior to 4 do not support `require('process')` (they only support the `process` global), however, the process import is necessary for compatibility with Deno, which is more important than supporting 5+ year old Node.js versions
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.2.0 2020 September 4

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.1.0 2020 August 18

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.0.0 2020 August 13

-   Since v2, engines have been the recommended way of stating compatibility, as such, blacklist functionality is now removed
    -   If anyone still requires blacklisting over engines, then file an issue
-   Work towards Deno and Web Browser compatibility
-   Additional API methods introduced, such that you can determine editions without loading them
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.16.0 2020 August 4

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.15.0 2020 July 24

-   Moved `semver` dependency from `devDependencies` to `dependencies` where it belongs (regression since v3.5.0, regressed again in v3.13.0)
    -   Thanks to [James Diamond](https://github.com/jdiamond) for [issue 91](https://github.com/bevry/editions/issues/91)
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.14.0 2020 July 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.13.0 2020 July 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.12.0 2020 July 21

-   Moved `semver` dependency from `devDependencies` to `dependencies` where it belongs (regression since v3.5.0)
    -   Thanks to [James Diamond](https://github.com/jdiamond) for [issue 91](https://github.com/bevry/editions/issues/91)
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.11.0 2020 July 3

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.10.0 2020 June 25

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.9.0 2020 June 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.8.0 2020 June 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.7.0 2020 June 20

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.6.0 2020 June 20

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.5.0 2020 June 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.4.0 2020 June 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.3.0 2020 May 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.2.0 2020 May 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.1.0 2020 May 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.0.0 2020 May 13

-   Support node >= 0.8 but test only against node >= 10
    -   We are still generating the same code, using ES5 compile target, so support remains the same
    -   However, testing ecosystem have been upgrading to node >= 10, as such unless all testing packages also function on node >= 0.8, which is possible but highly inconvenient then tests cannot run on such versions
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.3.0 2019 December 11

-   Rewrote in TypeScript
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.2.0 2019 September 11

-   Removed the `browser` edition introduced in v2.0.1 as the Editions Autloader has no use in the web browser
-   Updated dependencies

## v2.1.3 2018 December 29

-   Updated `errlop` dependency, should function to fix [issue #2](https://github.com/bevry/errlop/issues/2)

## v2.1.2 2018 December 29

Iternal change of not assuming the error `code` property exists, as on certain node versions its existance is denied. This should fix the following error:

```
./node_modules/editions/edition-node-0.8/index.js:310
      if (editionError.code.indexOf('unsupported-edition-engines-node-version') === 0) {
                           ^

TypeError: Cannot read property 'indexOf' of undefined
```

## v2.1.1 2018 December 29

Internal change of requiring a specific [Errlop](https://github.com/bevry/errlop) edition, which should function as a workaround for [errlop#2](https://github.com/bevry/errlop/issues/2) to fix the following error:

```
./node_modules/errlop/index.js:4
module.exports = require('editions').requirePackage(__dirname, require)
                                     ^

TypeError: require(...).requirePackage is not a function
```

## v2.1.0 2018 November 15

-   If none of the editions for a package match the current node version, editions will try to find a compatible package by converting strict version ranges likes `4 || 6 || 8 || 10` to looser ones like `>=4`, and if that fails, then it will attempt to load the last edition for the environment.
    -   This brings editions handling of engines closer in line with how node handles it, which is as a warning/recomendation, rather than a requirement/enforcement.
    -   This has the benefit that edition authors can specify ranges as the specific versions that they have tested the edition against that pass, rather than having to omit that information for runtime compatibility.
    -   As such editions will now automatically select the edition with guaranteed support for the environment, and if there are none with guaranteed support, then editions will select the one is most likely supported, and if there are none that are likely supported, then it will try the last edition, which should be the most compatible edition.
    -   This is timely, as node v11 is now the version most developers use, yet if edition authors specified only LTS releases, then the editions autoloader would reject loading on v11, despite compatibility being likely with the most upper edition.
    -   This behaviour is dictated by the new `strict` option, which omission of a value enables the above behaviour.
-   Change `syntaxes` to `tags`, with backwards compatibility. This applies to edition specifications, as well as for the blacklist environment variable which is now named `EDITIONS_TAG_BLACKLIST`.
-   Added codes to the different types of errors we may produce.
-   Upgraded babel from v6 to v7
-   Documentation has swapped from Documentation.js to JSDoc with the Minami theme.

## v2.0.2 2018 September 3

-   Fixed `Error: Cannot find module 'editions'` on Windows (caused by edition directories containing `:` which is unsupported on Windows)
    -   Regression in v2.0.0
    -   Closes
        -   [ungit issue #1130](https://github.com/FredrikNoren/ungit/issues/1130)
        -   [getmac issue #39](https://github.com/bevry/getmac/issues/39)
        -   [docpad issue #1088](https://github.com/docpad/docpad/issues/1088)
        -   [bevry thread #240](https://discuss.bevry.me/t/error-cannot-find-module-editions/240)

## v2.0.1 2018 August 24

-   Fixed potential `Error: Cannot find module 'editions'` (causes by `main` pointing to a legacy location
    -   Regression in v2.0.0
-   Added an edition for browsers

## v2.0.0 2018 July 27

-   Edition entries must now make use of the fields: `description`, `directory`, `entry`, and the new `engines` field (which follows the [`package.json:engines` spec](https://docs.npmjs.com/files/package.json#engines)).
-   In version 1, if an edition failed to load, its syntax combination would be blacklisted. This functionality has been removed. The `engines` field is a better replacement. The `syntaxes` field remains optional, as it is still useful for user configured blacklisting and ecosystem tooling.
-   Errors reported by the autoloader have improved readability thanks to [Errlop](https://github.com/bevry/errlop)
-   Updated base files

## v1.3.4 2018 January 31

-   Updated base files

## v1.3.3 2016 November 4

-   Properly add node 0.8 support

## v1.3.2 2016 November 4

-   Added node 0.8 support

## v1.3.1 2016 October 11

-   Fixed failure to load editions that had the edition directory within the edition entry
    -   Thanks to [Jordan Harband](https://github.com/ljharb) for [issue #20](https://github.com/bevry/editions/issues/20)

## v1.3.0 2016 October 11

-   Added support for `EDITIONS_SYNTAX_BLACKLIST` environment variable
    -   Thanks to [Damon Maria](https://github.com/damonmaria) for [issue #10](https://github.com/bevry/editions/issues/10)
-   Dropped need for `DEBUG_BEVRY_EDITIONS` as failures will not output all the necessary debugging information

## v1.2.1 2016 October 10

-   Change `esnext` skip from v8 engines < 4 to node engines < 0.12

## v1.2.0 2016 October 10

-   Skip syntaxes that require preprocessors
-   Skip `import` syntax, as the `module` field inside `package.json` skips the autoloader if supported
-   Skip `esnext` syntax on v8 engines < 4

## v1.1.2 2016 June 16

-   Parent errors are now displayed in a more sensible way

## v1.1.1 2016 March 20

-   Errors and debug messages are now more useful
    -   Closes https://github.com/bevry/editions/issues/5

## v1.1.0 2016 March 20

-   Added support for custom entry point overrides
-   Debugging goes to `console.error` (stderr) rather than `console.log` (stdout)
    -   Closes https://github.com/bevry/editions/issues/2
-   Added tests
    -   Closes https://github.com/bevry/editions/issues/4

## v1.0.1 2016 March 9

-   Initial release
