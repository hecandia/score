// Falla si algún archivo del sitio usa sintaxis posterior a ES5, que el
// Safari 9 del iPad (iOS 9.3.6) no entiende: let, const, flechas, clases,
// template strings… Sólo revisa sintaxis; APIs nuevas (Array.prototype.find,
// Object.assign) hay que evitarlas a mano.
'use strict';
var fs = require('fs');
var path = require('path');
var acorn = require('acorn');

var dir = path.join(__dirname, '..', 'js');
var archivos = fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); });
var fallas = 0;

archivos.forEach(function (f) {
  var codigo = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    acorn.parse(codigo, { ecmaVersion: 5, sourceType: 'script' });
    console.log('ES5 ok   js/' + f);
  } catch (e) {
    fallas++;
    console.error('NO ES5   js/' + f + ': ' + e.message);
  }
});

var prohibidas = /\.(find|findIndex|includes|startsWith|endsWith|repeat|padStart|fill)\(|Object\.(assign|values|entries)\(|Array\.from\(|\bPromise\b|\bfetch\(/;
archivos.forEach(function (f) {
  fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach(function (linea, i) {
    if (prohibidas.test(linea)) {
      fallas++;
      console.error('API no ES5 en js/' + f + ':' + (i + 1) + ': ' + linea.trim());
    }
  });
});

process.exit(fallas ? 1 : 0);
