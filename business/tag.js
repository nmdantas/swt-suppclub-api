/*
 * Tag business layer
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
    accessLayer.Tag.create(req.body).then(function(result) {
        res.json(result);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function update(req, res, next) {
    var id = req.params.id;

    accessLayer.Tag.update(req.body, { where: { id: id, deletedAt: null } }).then(function(result) {
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

    accessLayer.Tag.destroy({ where: { id: id } }).then(function(result) {
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
        accessLayer.Tag.findById(id).then(function(result) {
            if (result) {
                res.json(result);
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }            
        }, errorCallback);
    } else {
        accessLayer.Tag.findAll().then(function(results) {
            res.json(results);
        }, errorCallback);
    }
}