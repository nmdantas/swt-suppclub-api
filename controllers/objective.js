/*
 * Objectives controller
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var router      = require('express').Router();
var business    = require('./../business/objective');
var framework   = require('swt-framework');

router.post('/objectives', business.create);
router.post('/objectives/user', business.user.update);
router.get('/objectives', business.list);
router.get('/objectives/user', business.user.list);
router.get('/objectives/:id', business.list);
router.put('/objectives/:id', business.update);
router.delete('/objectives/:id', business.delete);



module.exports = router;