var fs = require('fs');
var path = require('path');
var wawoff = require('wawoff2');
var convertLib = require('./convertLib');

function convertFont(dirIn, dirOut, arrayConvert) {
    var dir,
        input = [],
        ttfArr = [],
        cssTeamplatesOut = [],
        weight = 'normal',
        style = 'normal',
        r = [],
        rName = [],
        formatConvert = ['ttf', 'svg', 'eot', 'woff'],
        nameFont = [];
        
    if (!dirOut) {
        dirOut = dirIn;
    } else {
        try {
            fs.lstatSync(dirOut).isDirectory();
        } catch(e) {
            arrayConvert = dirOut;
            dirOut = dirIn;
        }
    }

    if (arrayConvert) {
        formatConvert = arrayConvert.split(',');
    }

    try {
        dir = fs.readdirSync(dirIn);

        dir.forEach(function (a, _b) {
            if (fs.lstatSync(path.join(dirIn, a)).isFile()) {
                var format = a.split('.')[1];
                if (format === 'ttf' || format === 'otf') {
                    nameFont[_b] = a.split('.')[0];
                    ttfArr[_b] = path.join(dirIn, a);
                }
            }
        })

        ttfArr.forEach(function (a, _b) {
            input[_b] = fs.readFileSync(a);
        })

    } catch (e) {
        console.log(e);
        console.log("Не могу прочитать дерикторию (%s)", dirIn || 'stdin');
        process.exit(1);
    }

    input.forEach(function (a, _b) {
        var convFont = new convertLib(a);

        if (formatConvert.indexOf('eot') != -1) {
            var eot = convFont.ttf2eot(a);
        }

        if (formatConvert.indexOf('woff') != -1) {
            var woff = convFont.ttf2woff(a);
        }

        if (formatConvert.indexOf('svg') != -1) {
            var svg = convFont.renderByTmpl();
        }

        var ttfFontWeight = convFont.meta['Font subfamily'];
        var ttfFontFamily = convFont.meta['Font family'];
        var ttfFullName = convFont.meta['Full name'];
        var ttfFontName = convFont.meta['Postscript name'];
        var ttfPostscriptName = convFont.meta['Postscript name'];

        if (ttfFontWeight.indexOf('Thin') != -1 || ttfFontWeight.indexOf('Hairline') != -1) {
            weight = 100;
        } else if (ttfFontWeight.indexOf('Extra Light') != -1 || ttfFontWeight.indexOf('Ultra Light') != -1 || ttfFontWeight.indexOf('Thin') != -1) {
            weight = 200;
        } else if (ttfFontWeight.indexOf('Light') != -1) {
            weight = 300;
        } else if (ttfFontWeight.indexOf('Regular') != -1 || ttfFontWeight.indexOf('Normal') != -1) {
            weight = 400;
        } else if (ttfFontWeight.indexOf('Medium') != -1) {
            weight = 500;
        } else if (ttfFontWeight.indexOf('Semi Bold') != -1 || ttfFontWeight.indexOf('Demi Bold') != -1) {
            weight = 600;
        } else if (ttfFontWeight.indexOf('Bold') != -1) {
            weight = 700;
        } else if (ttfFontWeight.indexOf('Extra Bold') != -1 || ttfFontWeight.indexOf('Ultra Bold') != -1 || ttfFontWeight.indexOf('Heavy') != -1) {
            weight = 800;
        } else if (ttfFontWeight.indexOf('Black') != -1 || ttfFontWeight.indexOf('Heavy') != -1) {
            weight = 900;
        } else {
            weight = 'normal';
        }

        if (ttfFontWeight.indexOf('Italic') != -1) {
            style = 'italic';
        } else {
            style = 'normal';
        }

        if (formatConvert.indexOf('ttf') != -1) {
            var ttf1 = `\n         url('${ttfFontName}.ttf') format('truetype'),`;
            fs.writeFileSync(path.join(dirOut, ttfFontName + '.ttf'), new Buffer(a));
        } else {
            var ttf1 = '';
        }

        if (eot) {
            var eot1 = `\n    src: url('${ttfFontName}.eot');`;
            var eot2 = `\n         url('${ttfFontName}.eot?#iefix') format('embedded-opentype'),`;
            fs.writeFileSync(path.join(dirOut, ttfFontName + '.eot'), new Buffer(eot.buffer));
        } else {
            var eot1 = '';
            var eot2 = '';
        }

        if (woff) {
            var wofff = `\n         url('${ttfFontName}.woff') format('woff'),`
            fs.writeFileSync(path.join(dirOut, ttfFontName + '.woff'), new Buffer(woff.buffer));
        } else {
            var wofff = '';
        }

        if (svg) {
            var svg1 = `\n         url('${ttfFontName}.svg#${ttfFontName}') format('svg'),`
            fs.writeFileSync(path.join(dirOut, ttfFontName + '.svg'), new Buffer(svg));
        } else {
            var svg1 = '';
        }

        if (formatConvert.indexOf('woff2') != -1) {
            var woff21 = `\n         url('${ttfFontName}.woff2') format('woff2'),`;
            r[_b] = wawoff.compress(a);
            rName[_b] = ttfFontName;
        } else {
            var woff21 = '';
        }

        var arrayFont = [eot2, woff21, wofff, ttf1, svg1];
        arrayFont = arrayFont.filter(Boolean);
        arrayFont[arrayFont.length - 1] = arrayFont[arrayFont.length - 1].slice(0, -1) + ';';
        arrayFont = arrayFont.join('');

        cssTeamplatesOut[_b] = `@font-face {
    font-family: '${ttfFontFamily}';${eot1}        
    src: local('${ttfFontFamily+' '+ttfFontWeight}'),
         local('${ttfPostscriptName}'),${arrayFont}
    font-weight: ${weight};
    font-style: ${style};
}
`;

    });
    fs.writeFileSync(path.join(dirOut, 'font.css'), cssTeamplatesOut.join('\n'));

    if (formatConvert.indexOf('woff2') != -1) {
        Promise.all(r).then(r => {
            r.forEach(function (a, _b) {
                fs.writeFileSync(path.join(dirOut, rName[_b] + '.woff2'), new Buffer(a));
            })
        })
    }

    return true;
}

module.exports = convertFont;