/*
 * Category controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/category');
var framework   = require('swt-framework');

router.post('/categories', business.create);
router.get('/categories', business.list);
router.get('/categories/:id', business.list);
router.put('/categories/:id', business.update);
router.delete('/categories/:id', business.delete);

module.exports = router;