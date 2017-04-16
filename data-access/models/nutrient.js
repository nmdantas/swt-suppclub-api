/*
 * Nutrient Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('Nutrient', {
        name: { type: DataType.STRING, allowNull: false }
    }, {
        paranoid: true,
        underscored: false
    });
}