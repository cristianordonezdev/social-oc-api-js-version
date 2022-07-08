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

            const new_post = {
                uuid: uuid.v4(),
                user_uuid: request.body.user_uuid,
                caption: (request.body.caption) ? request.body.caption: '',
                images: '',
                created_at: new Date(),
                updated_at: new Date()
            }
            con.query('INSERT INTO posts SET ?', [new_post], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })
        
                uploadImage(request).then((res) => {
                    const images_urls = []
    
                    res.map((item) => {
                        images_urls.push(item.url)
                    })
                    const post_updated = {
                        images: images_urls.toString()
                    }
                    con.query('UPDATE posts SET ? WHERE uuid = ?', [post_updated, new_post.uuid])

                    return response.status(200).send({
                        message: 'added post',
                        rows
                    });
                })

            });

        });
    },

    editPost: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            const params = request.body;
            const post_updated = {
                caption: (params.caption) ? params.caption : null,
                tagged: (params.tagged) ? params.tagged : null,
                updated_at: new Date()
            }

            con.query('UPDATE posts SET ? WHERE uuid = ?', [post_updated, params.uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })

                return response.status(200).send({
                    message: 'Updated successfully'
                })
            })
        });
    },

    deletePost: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })
            const params = request.body;

            con.query('SELECT images FROM posts WHERE uuid = ?', [params.uuid], (err, rows) => {
                console.log(rows)
                const images = rows[0].images.split(',');
                images.forEach((item) => {
                    const deleter = async (path) => await cloudinary.delete(path);
                    deleter(`socialOC/${item.split('/')[8].split('.')[0]}`)
                })
            });
            con.query('DELETE FROM posts WHERE uuid = ?', [params.uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                })

                return response.status(200).send({
                    message: 'Deleted successfully'
                })
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

                    con.query('DELETE FROM likes WHERE post_uuid = ? and user_uuid = ? ', [params.post_uuid, params.user_uuid], (err, rows) => {
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

    getPostFollowers: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            })

            con.query('SELECT P.uuid, P.user_uuid, P.caption, P.images, P.tagged, P.updated_at, P.created_at FROM posts P JOIN followers F ON P.user_uuid = F.user_followed_uuid AND F.user_follower_uuid = ?', [request.params.user_uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });

                const new_rows = [];
                let counter = 0;
                rows.forEach((item) => {
                    con.query('SELECT name, profile_image FROM users WHERE uuid = ?', [item.user_uuid], (err, rows2) => {
                        if (err) return response.status(400).send({
                            message: err
                        });
                        
                        item['user_name'] = rows2[0].name;
                        item['user_profile_image'] = rows2[0].profile_image;
                        new_rows.push(item)
                        counter += 1 
                        
                        if(rows.length === counter) {
                            return response.status(200).send({
                                status: 'ok',
                                new_rows
                            });
                        } 
                    })

                })          
            })

        });
    },
}


module.exports = mainController;