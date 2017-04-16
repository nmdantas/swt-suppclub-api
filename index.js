/*
 * Supp Club Application
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-12 | Nicholas M. Dantas
 */

'use strict';

// Inicia as variaveis de ambiente
require('dotenv').config();

var PORT = process.env.PORT || 1337;
var API_PREFIX = '/api/v0';

var express     = require('express');
var bodyParser  = require('body-parser');
var compression = require('compression');
var framework   = require('swt-framework');
var controllers = require('./controllers');

var app = express();

app.use(bodyParser.json());
app.use(compression());

// Rota default
app.all('/', function(req, res) {
    res.json({
        api: process.env.APPLICATION_NAME,
        version: process.env.APPLICATION_VERSION
    });
});

// Habilita CORS
app.use(framework.security.enablePreflight);
// Verificacoes no Header Authorization
app.use(framework.security.checkAuthorization);

// Rotas
// Marcas
app.use(API_PREFIX, controllers.brand);
// Categorias
app.use(API_PREFIX, controllers.category);

// Middleware de erro
app.use(framework.logger.middleware);

// Inicia o servidor
app.listen(PORT);
console.log('Server Started...');