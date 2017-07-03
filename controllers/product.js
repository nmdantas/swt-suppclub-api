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
router.get('/products', business.get.all);
router.get('/products/:id', business.get.byId);
router.put('/products/:id', business.update);
router.delete('/products/:id', business.delete);

router.post('/products/pagination', business.get.all);
router.get('/products/reference/:code', business.get.byReference);
router.delete('/products/:id/relationship', business.deleteRelationship);

router.post('/products/image', business.uploadImage);
router.delete('/products/image/:id', business.deleteImage);
router.post('/products/image/find', business.findByImage);

router.post('/products/approval', business.approval.all);
router.put('/products/approval/:id', business.approval.update);

module.exports = router;