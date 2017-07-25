/*
 * Store Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('StoreAddress', {
        address: { type: DataType.STRING, allowNull: false },
        number: { type: DataType.STRING, allowNull: false },
        adjunct: { type: DataType.STRING, allowNull: true },
        district: { type: DataType.STRING, allowNull: false },
        city: { type: DataType.STRING, allowNull: false },
        state: { type: DataType.STRING, allowNull: false },
        zipcode: { type: DataType.STRING, allowNull: false },
        latitude: { type: DataType.STRING, allowNull: true },
        longitude: { type: DataType.STRING, allowNull: true }
    }, {
        paranoid: true,
        underscored: false
    });
}