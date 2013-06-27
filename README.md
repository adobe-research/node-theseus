Theseus
=======

`node-theseus` is a command for launching Node.js scripts for debugging with [Theseus](https://github.com/adobe-research/theseus).

Theseus is part of a collaboration between the [User Interface Design Group at MIT CSAIL](http://groups.csail.mit.edu/uid/) and [Adobe Research](http://research.adobe.com/).

Install
-------

1. Install the [Theseus](https://github.com/adobe-research/theseus) extension in Brackets
2. `npm install -g node-theseus`

Use
---

1. Start Node.js with `node-theseus [yourapp.js]`
2. Open `yourapp.js` in Brackets

Theseus will show call counts in the gutter next to every function definition any `require`'d `.js` files. Click on one or more of them to show a log of all calls to those functions with their arguments and return values.

The `--theseus-verbose` option prints light debugging output. `--theseus-verbose=2` prints heavy debugging output. Those options may be useful for troubleshooting the connection with Theseus.

The `--theseus-exclude=glob` option excludes the given file path glob from being instrumented. For example, `--theseus-exclude='*.js'` will exclude all the `*.js` files in the current directory.

The `--theseus-include-modules` option causes files in `node_modules` to also be instrumented. They aren't by default for performance reasons.

License
-------

node-theseus is MIT licensed.
