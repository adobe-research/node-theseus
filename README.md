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
2. Open `yourapp.js` with Brackets

Theseus will show call counts in the gutter next to every function definition any `require`'d `.js` files. Click on one or more of them to show a log of all calls to those functions with their arguments and return values.

License
-------

node-theseus is MIT licensed.
