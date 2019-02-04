#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const src = path.resolve(".", "out", "src", "language", "sml", "grammar");
const dst = path.resolve(".", "syntaxes", "sml.json");
fs.writeFileSync(dst, JSON.stringify(require(src).default, null, 2));
