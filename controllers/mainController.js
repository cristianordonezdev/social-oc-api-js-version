'use strict'

const fs = require('fs');
const uuid = require('uuid');
const cloudinary = require('../middlewares/cloudinary');

const mainController = {
    dashboard: (request, response) => {
        response.json({
            error: null,
            data: {
                title: 'It is a route protected',
                user: request.user
            }
        })
    },

    uploadPost: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            
            const uploadImage = async (request) => {
                const uploader = async (path) => await cloudinary.uploads(path, 'socialOC');
                    const urls = [];
                    const files = request.files;

                    if(files.length === 0) return response.status(400).send({message: 'there is no photo uploaded'})

                    for(const file of files) {
                        const {path} = file;
                        const new_path = await uploader(path);
                        urls.push(new_path);
                        fs.unlinkSync(path);
                    }
                    return urls
            }
            uploadImage(request).then((res) => {
                const images_urls = []

                res.map((item) => {
                    images_urls.push(item.url)
                })

                const new_post = {
                    uuid: uuid.v4(),
                    user_uuid: request.body.user_uuid,
                    caption: (request.body.caption) ? request.body.caption: '',
                    images: images_urls.toString(),
                    created_at: new Date(),
                    updated_at: new Date()
                }

                con.query('INSERT INTO posts SET ?', [new_post], (err, rows) => {
                    if (err) return response.status(400).send({
                        message: err
                    })
            
                    return response.status(200).send({
                        message: 'added post',
                        rows
                    });
                });
            })
        });
    }
}

module.exports = mainController;