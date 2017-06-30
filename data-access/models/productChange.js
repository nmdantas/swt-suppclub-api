/*
 * Product Change Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-06-27 | Thiago Ito
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('ProductChange', {
        original: { type: DataType.TEXT('long'), allowNull: false },
        change: { type: DataType.TEXT('long'), allowNull: false },
        userIdRequest: { type: DataType.INTEGER, allowNull: false },
        dateRequest: { type: DataType.DATE, allowNull: false, defaultValue: sequelize.NOW },
        userIdApproval: { type: DataType.INTEGER, allowNull: true },
        dateApproval: { type: DataType.DATE, allowNull: true },
        status: { type: DataType.INTEGER, allowNull: false, defaultValue: 1 } // 1 - Opened; 2 - Acceppt; 3 - Refused
    }, {
        paranoid: true,
        underscored: false,
        freezeTableName: true
    });
}