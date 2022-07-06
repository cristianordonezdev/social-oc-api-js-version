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
    },

    follow: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            
            const params = request.body;

            con.query('SELECT * FROM followers WHERE user_follower_uuid = ? and user_followed_uuid = ?', [params.user_follower_uuid, params.user_followed_uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })

                if (rows.length >= 1) {

                    con.query('DELETE FROM followers WHERE user_follower_uuid = ? and user_followed_uuid = ? ', [params.user_follower_uuid, params.user_followed_uuid], (err, rows) => {
                        if (err) return response.status(400).send({
                            message: err
                        })
                
                        return response.status(200).send({
                            message: 'Unfollow',
                            rows
                        });
                    })

                } else {
                    const follow = {
                        uuid: uuid.v4(),
                        user_follower_uuid: params.user_follower_uuid,
                        user_followed_uuid: params.user_followed_uuid,
                    }
        
                    con.query('INSERT INTO followers SET ? ', [follow], (err, rows) => {
                        if (err) return response.status(400).send({
                            message: err
                        })
                
                        return response.status(200).send({
                            message: 'Following',
                            rows
                        });
                    })
                }
            })


        });
    },

    like: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            
            const params = request.body;

            con.query('SELECT * FROM likes WHERE post_uuid = ? and user_uuid = ?', [params.post_uuid, params.user_uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })

                if (rows.length >= 1) {

                    con.query('DELETE FROM users WHERE post_uuid = ? and user_uuid = ? ', [arams.post_uuid, params.user_uuid], (err, rows) => {
                        if (err) return response.status(400).send({
                            message: err
                        })
                
                        return response.status(200).send({
                            message: 'Dislike',
                            rows
                        });
                    })

                } else {
                    const like = {
                        uuid: uuid.v4(),
                        post_uuid: params.post_uuid,
                        user_uuid: params.user_uuid,
                        created_at: new Date()
                    }
        
                    con.query('INSERT INTO likes SET ? ', [like], (err, rows) => {
                        if (err) return response.status(400).send({
                            message: err
                        })
                
                        return response.status(200).send({
                            message: 'Like',
                            rows
                        });
                    })
                }
            })


        });
    },

    getPost: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })

            con.query('SELECT P.uuid, P.user_uuid, P.caption, P.images, P.tagged, P.updated_at, P.created_at FROM posts P JOIN followers F ON P.user_uuid = F.user_followed_uuid AND F.user_follower_uuid = ?', [request.body.user_uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });

                return response.status(200).send({
                    status: 'ok',
                    rows
                });
            })

        });
    }
}


module.exports = mainController;