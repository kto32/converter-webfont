#!/usr/bin/env node
'use strict';

var ArgumentParser = require('argparse').ArgumentParser;
var convertFont = require('converter-webfont');

var parser = new ArgumentParser({
    verison: '0.01',
    addHelp: true,
    description: 'Конвертор шрифтов'
});

parser.addArgument(
    ['infile'], {
        nargs: '?',
        help: 'Папка с шрифтами в виде ./font (stdin if not defined)'
    }
);

parser.addArgument(
    ['outfile'], {
        nargs: '?',
        help: 'Папка вывода шрифтов в виде ./font (stdout if not defined)'
    }
);

parser.addArgument(
    ['format'], {
        nargs: '?',
        help: 'Формат данных через запятую ttf,svg,eot,woff,woff2 (по умолчанию ttf,svg,eot,woff)'
    }
);

var args = parser.parseArgs();


try {
    convertFont(args.infile, args.outfile, args.format);
} catch (err) {
    console.log(err);
}