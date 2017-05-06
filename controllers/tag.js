/*
 * Tag controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/tag');
var framework   = require('swt-framework');

router.post('/tags', business.create);
router.get('/tags', business.list);
router.get('/tags/:id', business.list);
router.put('/tags/:id', business.update);
router.delete('/tags/:id', business.delete);

module.exports = router;