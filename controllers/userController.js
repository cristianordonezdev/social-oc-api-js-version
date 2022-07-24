const uuid = require('uuid');
const validator = require('validator');

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

            const uuid = request.params.uuid;

            con.query('SELECT * FROM users WHERE uuid = ? ', [uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });
                let user = rows[0];
                delete user.password

                con.query('SELECT * FROM followers WHERE user_follower_uuid = ? ', [uuid], (err, rows) => {
                    user['following'] = rows.length - 1
                })
                con.query('SELECT * FROM followers WHERE user_followed_uuid = ? ', [uuid], (err, rows) => {
                    user['followers'] = rows.length - 1
                })

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

    followersList: (request, response)=> {
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

    followingList: (request, response)=> {
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
}

module.exports = controller;