# Converter-webfont

> Конвертер шрифтов из ttf,otf в форматы svg,woff,woff2,eot


## Readme

[EN](https://github.com/kto32/converter-webfont/README.md)

## Начиная
### Установка глобально
```shell
npm install converter-webfont -g

npm install git://github.com/kto32/converter-webfont -g
```
#### Пример использования
```shell
cwebfont ./pathIn ./pathTo format
```

### Установка в проект
```shell
npm install converter-webfont

npm install git://github.com/kto32/converter-webfont
```

#### Пример использования
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

или 


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

Путь до папки с шрифтами формата ttf, otf. Файлы других форматов в папке игнорируются.

##### ./pathTo
Type: `String`

Путь для сохранения результата.

> Если не указать путь до папки сохранения результата, а указать формат либо оставить поле пустым, то реузльтат будет сохранен в туже папку

#### format
Type: `String`

Default value: `svg,ttf,eot,woff`

Указать форматы через запятую, возможные форматы: `svg,ttf,eot,woff,woff2`.

> При использовании woff2 скрипт будет отрабатывать чуть дольше из за компрессии.


## Release History
_(v.0.0.0)_

_(v.1.0.0)_
