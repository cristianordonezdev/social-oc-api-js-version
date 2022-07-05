'use strict'

const validator = require('validator');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwb = require('jsonwebtoken');

const controller = {
    test: (request, response) => {
        return response.status(200).send({
            message: "Este es un mensaje de prueba, todo ok"
        });
    },
    getUsers: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })

            con.query("SELECT * FROM users", (err, rows) => {
                if (err) return response.status(400).send(err)

                return response.status(200).send({
                    status: "ok",
                    rows
                })
            })
        })
    },
    login: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            
            const params = request.body;
            const email = !validator.isEmpty(params.email);
            const password = !validator.isEmpty(params.password);

            if (email && password) {
                con.query("SELECT * FROM users WHERE email = ?",[params.email] ,(err, rows) => {
                    if (err) return response.status(400).send(err)

                    if (rows.length == 0) return response.status(400).send({message: 'Theres is no email registered'})
                    
                    if (rows.length >= 1) {
                        const verified_password = bcrypt.compareSync(params.password, rows[0].password);
                        
                        if (!verified_password) {
                            return response.status(400).send({message: 'The password is incorrect'})
                        } else {

                            const token = jwb.sign({
                                name: rows[0].name,
                                lastname: rows[0].lastname,
                                nickname: rows[0].nickname,
                                gender: rows[0].gender,
                                email: rows[0].email,
                                roll: rows[0].roll,
                            }, process.env.TOKEN_SECRET);

                            response.header('auth-token', token).json({
                                error: null,
                                data: {token},
                                message: 'Welcome!'
                            })
                        }
                    }
                })
            } else {
                return response.status(400).send({
                    message: "Incomplete data"
                })
            }
        })
    },

    register: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            
            const params = request.body;

            const name = !validator.isEmpty(params.name);
            const lastname = !validator.isEmpty(params.lastname);
            const nickname = !validator.isEmpty(params.nickname);
            const gender = !validator.isEmpty(params.gender);
            const date_birth = !validator.isEmpty(params.date_birth);
            const email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            let exist_email = false;

            con.query("SELECT * FROM USERS WHERE email = ?", [request.body.email], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })
             
                if(rows.length >= 1) exist_email = true

                if (name && lastname && nickname && gender && date_birth && email && !exist_email) {
                    const is_strong_passoword = !validator.isStrongPassword(params.password);

                    if (is_strong_passoword) return response.status(400).send({
                        message: 'It is not a strong password'
                    });

                    const password_hashed = bcrypt.hashSync(params.password, 10);

                    const new_user = {
                        uuid: uuid.v4(),
                        name: params.name,
                        lastname: params.lastname,
                        nickname: params.nickname,
                        gender: params.gender,
                        date_birth: params.date_birth,
                        email: params.email,
                        password: password_hashed,
                        created_at: new Date(),
                        updated_at: new Date(),
                    };
                    con.query("INSERT INTO users SET ?", [new_user], (err) => {
                        if (err) return response.status(400).send({
                            message: err
                        })

                        return response.status(200).send({
                            status: 'ok',
                            message: 'Added successfully',
                        })
                    });
                } else {
                    if (exist_email) {
                        return response.status(400).send({
                            message: 'Already exists an email registered'
                        });
                    }
                    return response.status(400).send({
                        message: 'Data is incomplete'
                    });
                }
            });
        });
    }
}

module.exports = controller;