/*
 * Objective business layer
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
    delete: destroy,
    user: {
        update: updateUserObjectives,
        list: listUserObjectives
    }
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
    var responseBody = {};

    accessLayer.orm.transaction(function(t) {
        return accessLayer.Objective.create(req.body, { transaction: t }).then(function(objective) {
            return objective.setTags(req.body.tags, { transaction: t }).then(function(tags) {
                responseBody = objective;
            });
        });
    }).then(function(result) {
        res.json(responseBody);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function update(req, res, next) {
    var id = req.params.id;
    
    accessLayer.orm.transaction(function(t) {

        return accessLayer.Objective.update(req.body, { 
            where: { 
                id: id, 
                deletedAt: null 
            } 
        }).then(function(result) {

            return accessLayer.Objective.findById(id, { transaction: t }).then(function(objective) {

                return objective.setTags(req.body.tags, { transaction: t });
            });
        });
    }).then(function(result) {
        res.end();
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });
        
        next(customError);
    });
}

function destroy(req, res, next) {
    var id = req.params.id;

    accessLayer.Objective.destroy({ where: { id: id } }).then(function(result) {
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
        accessLayer.Objective.findById(id, {             
            include: [{model: accessLayer.Tag, attributes: ['id', 'name'] }]
        }).then(function(result) {
            if (result) {
                res.json(result);
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }            
        }, errorCallback);
    } else {
        accessLayer.Objective.findAll({ 
            include: [{ model: accessLayer.Tag, require: false }]
        }).then(function(results) {
            res.json(results);
        }, errorCallback);
    }
}

function updateUserObjectives(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    
    var objectivesUsers = [];
    for (var i = 0; i < req.body.length; i++) {
        objectivesUsers.push({
            userId: cache.user.id,
            objectiveId: req.body[i].id
        });
    }

    accessLayer.orm.transaction(function(t) {

        return accessLayer.ObjectivesUsers.destroy({ where: { userId: cache.user.id } }).then(function(result) {
            return accessLayer.ObjectivesUsers.bulkCreate(objectivesUsers, { transaction: t });

        });

    }).then(function(result) {
        res.end();
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });
        
        next(customError);
    });
}

function listUserObjectives(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    
    accessLayer.ObjectivesUsers.findAll({ 
        where: { userId: cache.user.id }
    }).then(function(results) {
        res.json(results);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}
    