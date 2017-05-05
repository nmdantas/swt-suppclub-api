/*
 * Nutrient controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-04 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/nutrient');
var framework   = require('swt-framework');

router.post('/nutrients', business.create);
router.get('/nutrients', business.list);
router.get('/nutrients/:id', business.list);
router.put('/nutrients/:id', business.update);
router.delete('/nutrients/:id', business.delete);

module.exports = router;