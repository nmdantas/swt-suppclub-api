/*
 * Nutrient Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('Nutrient', {
        name: { type: DataType.STRING, allowNull: false },
        description: { type: DataType.STRING, allowNull: true },
        status: { type: DataType.INTEGER, allowNull: false, defaultValue: 3 }
    }, {
        paranoid: true,
        underscored: false
    });
}