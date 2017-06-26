/*
 * Category business layer
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var accessLayer = require('./../data-access');
var framework   = require('swt-framework');
var logManager  = framework.logger;

module.exports = {
    list: list,
    create:[
        preValidation,
        create
    ],
    update: [
        preValidation,
        update
    ],
    delete: destroy
};

function preValidation(req, res, next) {
    var constraints = framework.common.validation.requiredFor('name');
    var validationErrors = framework.common.validation.validate(req.body, constraints);

    if (validationErrors) {
        var error = new framework.models.SwtError({ httpCode: 400, details: validationErrors });

        next(error);
    } else {
        next();
    }
}

function create(req, res, next) {
    req.body.categoryId = req.body.categoryId == "0" ? null : req.body.categoryId;
    accessLayer.Category.create(req.body).then(function(result) {
        res.json(result);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function update(req, res, next) {
    var id = req.params.id;
    req.body.categoryId = (req.body.categoryId == "0" || req.body.categoryId == "null") ? null : req.body.categoryId;
    accessLayer.Category.update(req.body, { where: { id: id, deletedAt: null } }).then(function(result) {
        if (result[0]) {
            res.end();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function destroy(req, res, next) {
    var id = req.params.id;

    accessLayer.Category.findById(id, { 
        include: [{ 
            model: accessLayer.Product, 
            as: 'products' 
        }] 
    }).then(function(category) {
        if (category && (!category.products || category.products.length == 0)) {
            
            category.destroy().then(function(result) {
                if (result) {
                    res.end();
                } else {
                    var customError = new framework.models.SwtError({ httpCode: 404, message: 'O Registro não pode ser excluído.' });

                    next(customError);
                }
            }, errorCallback);
            
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, code: 'SWT0099', message: (category ? 'O Registro não pode ser excluído.' : 'Registro não encontrado') });

            next(customError);
        }            
    }, errorCallback);
}

function list(req, res, next) {
    var id = req.params.id;
    
    // Verifica se a seleção deve ser feita pelo id
    if (id) {
        accessLayer.Category.findById(id).then(function(result) {
            if (result) {
                res.json(result);
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }            
        }, errorCallback);
    } else {
        accessLayer.Category.findAll({ include: [{ all: true }]}).then(function(results) {
            var categories = [];

            for (var i = 0; i < results.length; i++) {
                categories.push(results[i].dataValues);
            }

            res.json(categories);
        }, errorCallback);
    }
}

var errorCallback = function(error) {
    var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

    next(customError);
};