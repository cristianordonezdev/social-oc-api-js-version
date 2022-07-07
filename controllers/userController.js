const uuid = require('uuid');

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
            })

            con.query('SELECT * FROM users WHERE uuid = ? ', [request.body.uuid], (err, rows) => {
                if (err) return response.status(400).send({
                    message: err
                });
                let user = rows[0];
                delete user.password

                con.query('SELECT * FROM followers WHERE user_follower_uuid = ? ', [request.body.uuid], (err, rows) => {
                    user['following'] = rows.length - 1
                })
                con.query('SELECT * FROM followers WHERE user_followed_uuid = ? ', [request.body.uuid], (err, rows) => {
                    user['followers'] = rows.length - 1
                })

                con.query('SELECT * FROM posts WHERE user_uuid = ? ', [request.body.uuid], (err, rows) => {
                    if (err) return response.status(400).send({
                        message: err
                    });

                    user['posts'] = rows;
                    return response.status(200).send({
                        status: 'ok',
                        user
                    });
                })
            })

        });
    },
}

module.exports = controller;