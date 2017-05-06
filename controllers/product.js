/*
 * Product controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/product');
var framework   = require('swt-framework');

router.post('/products', business.create);
router.get('/products', business.list);
router.get('/products/:id', business.list);
router.put('/products/:id', business.update);
router.delete('/products/:id', business.delete);

module.exports = router;