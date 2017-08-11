/*
 * Objectives x Users Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-06-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('ObjectivesUsers', {
        objectiveId: { type: DataType.INTEGER, allowNull: false, primaryKey: true },
        userId: { type: DataType.INTEGER, allowNull: false, primaryKey: true }
    }, {
        underscored: false,
        freezeTableName: true
    });
}