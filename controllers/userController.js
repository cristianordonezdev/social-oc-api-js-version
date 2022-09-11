const uuid = require('uuid');
const validator = require('validator');
const cloudinary = require('../middlewares/cloudinary');
const fs = require('fs');

const controller = {
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

    getUser: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            });

            const uuid = request.body.uuid;
            const own_user_uuid = request.body.own_user_uuid;

            con.query('SELECT * FROM users WHERE uuid = ? ', [uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });
                let user = rows[0];
                delete user.password

                con.query('SELECT * FROM followers WHERE user_follower_uuid = ? ', [uuid], (err, rows) => {
                    user['following'] = rows.length - 1
                });
                con.query('SELECT * FROM followers WHERE user_followed_uuid = ? ', [uuid], (err, rows) => {
                    user['followers'] = rows.length - 1
                });
                con.query('SELECT user_followed_uuid FROM followers WHERE user_follower_uuid = ? ', [own_user_uuid], (err, results) => {
                    user['you_follow'] = results.find((obj) => obj.user_followed_uuid === uuid) !== undefined;
                });

                con.query('SELECT * FROM posts WHERE user_uuid = ? ORDER BY created_at DESC', [uuid], (err, rows) => {
                    if (err) return response.status(400).send({
                        message: err
                    });
                    user['number_post'] = rows.length;
                    user['posts'] = rows;
                    return response.status(200).send({
                        status: 'ok',
                        user
                    });
                })
            })

        });
    },

    followersList: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            });


            const params = request.params;

            con.query('SELECT U.uuid, U.name, U.nickname, U.profile_image FROM users U JOIN followers F ON U.uuid = F.user_follower_uuid AND F.user_followed_uuid = ?', [params.uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });

                con.query('SELECT U.uuid, U.name, U.nickname, U.profile_image FROM users U JOIN followers F ON U.uuid = F.user_followed_uuid AND F.user_follower_uuid = ?', [params.uuid], (err, rows2) => {
                    if (err) return response.status(400).send({
                        message: err
                    });
                    const followers_list = rows.filter((item) => item.uuid !== params.uuid)
                    const following_list = rows2.filter((item) => item.uuid !== params.uuid)

                    followers_list.map((item) => {
                        if (following_list.find((i) => i.uuid === item.uuid) !== undefined)
                            item['you_follow'] = true
                        else
                            item['you_follow'] = false
                    })
                    return response.status(200).send({
                        message: 'ok',
                        followers_list
                    });
                });
            })
        });
    },

    followingList: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            });


            const params = request.params;

            con.query('SELECT U.uuid, U.name, U.nickname, U.profile_image FROM users U JOIN followers F ON U.uuid = F.user_followed_uuid AND F.user_follower_uuid = ?', [params.uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });

                const following_list = rows.filter((item) => item.uuid !== params.uuid)

                following_list.map((item) => {
                    item['you_follow'] = true
                })

                return response.status(200).send({
                    message: 'ok',
                    following_list
                });
            })
        });
    },

    editUser: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            });

            const params = request.body;
            const name = (params.name) ? !validator.isEmpty(params.name) : true;
            const lastname = (params.lastname) ? !validator.isEmpty(params.lastname) : true;
            const nickname = (params.nickname) ? !validator.isEmpty(params.nickname) : true;
            const gender = (params.gender) ? !validator.isEmpty(params.gender) : true;
            const email = (params.email) ? !validator.isEmpty(params.email) && validator.isEmail(params.email) : true;

            if (name && lastname && nickname && gender && email) {
                con.query('SELECT * FROM users WHERE email = ? ', [params.email], (err, rows) => {
                    if (rows.length >= 1) {
                        if ((rows[0].uuid !== params.uuid) && rows[0].email === params.email) {
                            return response.status(400).send({
                                message: 'Already in use that email'
                            });
                        }
                    }
                });

                const user_updated = {
                    name: params.name,
                    lastname: params.lastname,
                    nickname: params.nickname,
                    gender: params.gender,
                    email: params.email,
                };

                con.query('UPDATE users SET ? WHERE uuid = ? ', [user_updated, params.uuid], (err, rows) => {
                    if (err) return response.status(400).send({
                        err
                    });

                    return response.status(400).send({
                        status: 'ok',
                        rows
                    });
                })
            } else {
                return response.status(400).send({
                    message: 'Data is incomplete'
                });
            }
        });
    },

    getSuggestions: (request, response) => {
        request.getConnection((err, con) => {
            if (err) return response.status(400).send({
                message: err
            });


            //GET AN ALGORHIT TO MAKE SUGGESTIONS

            //THE LOGIC WILL BE ABLE TO SHOW MY NO FOLLOWERS, HOWEVER IS NOT THE BEST PRACTICE, TRY TO RESOLVE THIS
            const uuid = request.params.uuid;

            con.query('SELECT U.uuid, U.name, U.nickname, U.profile_image FROM users U JOIN followers F ON U.uuid = F.user_followed_uuid AND F.user_follower_uuid = ?', [uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });
                const following = rows;
                con.query('SELECT uuid, name, nickname, profile_image FROM users WHERE NOT uuid = ?', [uuid], (err, rows) => {
                    if (err) return response.status(400).send({
                        message: err
                    });
                    const not_following = []

                    rows.forEach((i) => {
                        let you_follow = false;
                        following.forEach((j) => {
                            if ((j.uuid === i.uuid)) {
                                you_follow = true
                            }
                        })

                        if (!you_follow) {
                            not_following.push(i)
                        }
                    });
                    return response.status(200).send({
                        message: 'ok',
                        not_following
                    });
                })
            })
        });
    },

    uploadProfilePicture: (request, response) => {
      request.getConnection((err, con) => {
        if (err) return response.status(400).send({
          message: err
        });
        const user_uuid = request.body.user_uuid;
        const picture = request.files[0];
        const uploadImage = async () => {
          const uploader = async (path) => await cloudinary.uploads(path, 'socialOC');
            let url = {};
            const {path} = picture;
            const new_path = await uploader(path);
            url = new_path;
            fs.unlinkSync(path);
            return url;
        };

        uploadImage().then((response_upload) => {
          const obj_updated = {
            profile_image: response_upload.url,
          };
          con.query('UPDATE users SET ? WHERE uuid = ?', [obj_updated, user_uuid], (err, res_updated) => {
            return response.status(200).send({
                message: 'The profile picture has been uploaded',
                profile_image: response_upload.url
            });
          });
        });
      });
    },

    deleteProfilePicture: (request, response) => {
        request.getConnection((err, con) => {
          if (err) return response.status(400).send({
            message: err
          });
          const user_uuid = request.body.user_uuid;

          con.query('SELECT profile_image FROM users WHERE uuid = ?', [user_uuid], (err, rows) => {
            const image = rows[0].profile_image;
            const deleter = async (path) => await cloudinary.delete(path);
            deleter(`socialOC/${image.split('/')[8].split('.')[0]}`);
          });

          const obj_updated = {
            profile_image: null
          };
          con.query('UPDATE users SET ? WHERE uuid = ?', [obj_updated, user_uuid], (err, rows) => {
            return response.status(200).send({
              message: 'The profile picture has been deleted',
              profile_image: null
            });
          });
        });
      }
}

module.exports = controller;