/*
 * Store Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('Store', {
        name: { type: DataType.STRING, allowNull: false },
        nickname: { type: DataType.STRING, allowNull: false },
        phone: { type: DataType.STRING, allowNull: true },
        email: { 
            type: DataType.STRING, 
            allowNull: false, 
            validate: { 
                isEmail: true 
            } 
        }
    }, {
        paranoid: true,
        underscored: false
    });
}