node-theseus
============

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

The process will continue to run even after your program finishes so that you can connect to it with [Theseus](https://github.com/adobe-research/theseus).

The `--theseus-verbose` option prints light debugging output. `--theseus-verbose=2` prints heavy debugging output. Those options may be useful for troubleshooting the connection with Theseus.

The `--theseus-exclude=glob` option excludes the given file path glob from being instrumented. For example, `--theseus-exclude='*.js'` will exclude all the `*.js` files in the current directory.

The `--theseus-include-modules` option causes files in `node_modules` to also be instrumented. They aren't by default for performance reasons.

The `--theseus-max-invocations-per-tick=number` option changes the number of function invocations to record for a single tick before pausing trace collection until the next tick. The default is 4096. This limit prevents Theseus from using a ridiculous amount of memory for programs that are *occasionally* computationally intensive by detecting the intense computation and not recording all of the details.

License
-------

node-theseus is MIT licensed.
