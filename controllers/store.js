/*
 * Store controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/store');
var framework   = require('swt-framework');

router.get('/stores', business.get.all);
router.get('/stores/:id', business.get.byId);
router.get('/stores/:id/shift', business.get.storeShift);
router.put('/stores/:id', business.update.data);
router.get('/stores/user/:id', business.get.byUser);

router.post('/stores/open', business.update.open);

module.exports = router;