/*
 * Store Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('StoreParameters', {
        enableSession: { type: DataType.BOOLEAN, allowNull: false, defaultValue: true }
    }, {
        paranoid: true,
        underscored: false
    });
}