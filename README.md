# Converter-webfont

> Конвертор шрифотов из ttf,otf в форматы svg,woff,woff2,eot

## Getting Started
### Установка глобально
```shell
npm install converter-webfont -g
```
#### Пример использования
```shell
cwebfont ./pathIn ./pathTo format
```

### Установка в проект
```shell
npm install converter-webfont
```

#### Пример использования
```js
var convertFont = require('converter-webfont');

//do something

try {
    convertFont(./pathIn, ./pathTo, format);
} catch (err) {
    console.log(err);
}

//do something
```

или 


```js
var convertFont = require('converter-webfont');

//do something

convertFont(./pathIn, ./pathTo, format);

//do something
```

#### options

##### ./pathIn
Type: `String`
Required: `true`
Путь до папки с шрифтами формата ttf,otf другие форматы игнорируются в папке

##### ./pathTo
Type: `String`
Путь для сохранения результата.

> Если ну указать путь до папки сохранения результата, а указать формат либо оставить поле пустым, то реузльтат будет сохранен в туже папку

#### format
Type: `String`
Default value: `svg,ttf,eot,woff`
Указать форматы через запятую, возможные форматы: svg,ttf,eot,woff,woff2(при использовании woff2 скрипт будет отробатывать чуть дольше из за компрессии).