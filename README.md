# Converter-webfont

> Font converter from ttf, otf to svg, woff, woff2, eot formats

## Readme

[RU](https://github.com/kto32/converter-webfont/README_RU.md)

## Getting Started
### Installation globally
```shell
npm install converter-webfont -g

npm install git://github.com/kto32/converter-webfont -g
```
#### Usage example
```shell
cwebfont ./pathIn ./pathTo format
```

### Installation in the project
```shell
npm install converter-webfont

npm install git://github.com/kto32/converter-webfont
```

#### Usage example
```js
var convertFont = require('converter-webfont');

//do something

try {
    convertFont('./pathIn', './pathTo', 'svg,eot,ttf,woff');
} catch (err) {
    console.log(err);
}

//do something
```

or


```js
var convertFont = require('converter-webfont');

//do something

convertFont('./pathIn', './pathTo', 'svg,eot,ttf,woff');

//do something
```

#### options

##### ./pathIn
Type: `String`

Required: `true`

The path to the folder with fonts in the ttf, otf format. Files of other formats in the folder are ignored.

##### ./pathTo
Type: `String`

The path to save the result.

> If you don't specify the path to the folder for saving the result, but specify the format or leave the field empty, then the result will be saved in the same folder

#### format
Type: `String`

Default value: `svg,ttf,eot,woff`

Specify formats separated by commas, possible formats: `svg,ttf,eot,woff,woff2`.

> When using woff2, the script will work out a little longer due to compression.


## Release History
_(v.0.0.0)_

_(v.1.0.0)_
