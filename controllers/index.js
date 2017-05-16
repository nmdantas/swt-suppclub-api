/*
 * Controllers Layer
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var brand     = require('./brand');
var category  = require('./category');
var nutrient  = require('./nutrient');
var product   = require('./product');
var tag       = require('./tag');
var objective = require('./objective');

module.exports = {
    brand: brand,
    category: category,
    nutrient: nutrient,
    product: product,
    tag: tag,
    objective: objective
}