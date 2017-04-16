/*
 * Brand controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/brand');
var framework   = require('swt-framework');

router.post('/brands', business.create);
router.get('/brands', business.list);
router.get('/brands/:id', business.list);
router.put('/brands/:id', business.update);
router.delete('/brands/:id', business.delete);

module.exports = router;