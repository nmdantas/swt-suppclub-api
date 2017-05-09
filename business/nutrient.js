/*
 * Nutrient business layer
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-04 | Nicholas M. Dantas
 */

'use strict';

var accessLayer = require('./../data-access');
var framework   = require('swt-framework');
var logManager  = framework.logger;

module.exports = {
    list: list,
    create:[
        preValidation,
        hasSameRegistered,
        create
    ],
    update: [
        preValidation,
        hasSameRegistered,
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

function hasSameRegistered(req, res, next) {
    var varId = req.body.id || 0;
    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    accessLayer.Nutrient.findAll({ 
        where: {
            id: { $ne: varId }, 
            name: { $like: req.body.name  }
        }
    }).then(function(result) {
        if (result) {

            if (result.length > 0) {
                var customError = new framework.models.SwtError({ httpCode: 400, message: 'Nutriente já cadastrado!' });

                next(customError);
            } else {
                next();
            }

        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    }, errorCallback);
}

function create(req, res, next) {
    accessLayer.Nutrient.create(req.body).then(function(result) {
        res.json(result);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function update(req, res, next) {
    var id = req.params.id;
    var identity = framework.common.parseAuthHeader(req.headers.authorization);
    
    // Verifica se ha "sessao" criada para o usuario
    if (global.CacheManager.has(identity.token)) {
        // Verifica se o usuario tem permissao para editar o status
        if (global.CacheManager.get(identity.token).roles.indexOf("Admin") == -1) {
            req.body.status = 3;
        }
    }

    accessLayer.Nutrient.update(req.body, { where: { id: id, deletedAt: null } }).then(function(result) {
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

    accessLayer.Nutrient.destroy({ where: { id: id } }).then(function(result) {
        if (result) {
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

function list(req, res, next) {
    var id = req.params.id;
    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    // Verifica se a seleção deve ser feita pelo id
    if (id) {
        accessLayer.Nutrient.findById(id).then(function(result) {
            if (result) {
                res.json(result);
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }
        }, errorCallback);
    } else {
        accessLayer.Nutrient.findAll().then(function(results) {
            var categories = [];

            for (var i = 0; i < results.length; i++) {
                categories.push(results[i].dataValues);
            }

            res.json(categories);
        }, errorCallback);
    }
}