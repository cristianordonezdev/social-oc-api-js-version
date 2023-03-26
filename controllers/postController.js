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
  likePost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const post_uuid = request.body.post_uuid;
      const user_uuid = request.user.uuid;
      con.query('SELECT * FROM likes WHERE post_uuid = ? and user_uuid = ?', [post_uuid, user_uuid], (err, rows) => {
        if (err) return response.status(400).send({
          message: err
        })
        if (rows.length >= 1) {

          con.query('DELETE FROM likes WHERE post_uuid = ? and user_uuid = ? ', [post_uuid, user_uuid], (err, rows) => {
            if (err) return response.status(400).send({
              message: err
            });

            return response.status(200).send({
              status: 'dislike_post',
              rows
            });
          });

        } else {
          const like = {
            uuid: uuid.v4(),
            post_uuid: post_uuid,
            user_uuid: user_uuid,
            type_like: 'post',
            created_at: new Date()
          }

          con.query('INSERT INTO likes SET ? ', [like], (err, rows) => {
            if (err) return response.status(400).send({
              message: err
            });
            return response.status(200).send({
              status: 'like_post',
              rows
            });
          });
        }
      });
    });
  },
  likeComment: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const params = request.body;
      const user_uuid = request.user.uuid;
      con.query('SELECT * FROM likes WHERE post_uuid = ? and user_uuid = ? and comment_uuid = ?', [params.post_uuid, user_uuid, params.comment_uuid], (err, rows) => {
        if (err) return response.status(400).send({
          message: err
        })
        if (rows.length >= 1) {

          con.query('DELETE FROM likes WHERE post_uuid = ? and user_uuid = ? and comment_uuid = ?', [params.post_uuid, user_uuid, params.comment_uuid], (err, rows) => {
            if (err) return response.status(400).send({
              message: err
            });

            return response.status(200).send({
              status: 'dislike_comment',
              rows
            });
          });

        } else {
          const like = {
            uuid: uuid.v4(),
            post_uuid: params.post_uuid,
            user_uuid: user_uuid,
            comment_uuid: params.comment_uuid,
            type_like: 'comment',
            created_at: new Date()
          }

          con.query('INSERT INTO likes SET ? ', [like], (err, rows) => {
            if (err) return response.status(400).send({
              message: err
            });
            return response.status(200).send({
              status: 'like_comment',
              rows
            });
          });
        }
      });
    });
  },
  getPost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      });
      const uuid = request.params.uuid;
      const own_user_uuid = request.user.uuid;
      con.query('SELECT * FROM posts WHERE uuid = ?', [uuid], (err, rows) => {
        if (err) return response.status(400).send({
          message: err
        });
        con.query('SELECT name, profile_image FROM users WHERE uuid = ?', [rows[0].user_uuid], (err, rows2) => {
          if (err) return response.status(400).send({
            message: err
          });
          rows[0]['user_name'] = rows2[0].name;
          rows[0]['user_profile_image'] = rows2[0].profile_image;
          con.query('SELECT uuid, user_uuid FROM likes WHERE post_uuid = ?', [uuid], (err, user_like) => {
            const exist_like = user_like.find((item) => item.user_uuid === own_user_uuid);
            if (exist_like !== undefined) {
              rows[0]['like_post'] = true;
            } else {
              rows[0]['like_post'] = false;
            }
          });
          con.query("SELECT user_uuid FROM likes WHERE post_uuid = ? AND type_like = 'post'", [uuid], (err, users_uuids) => {
            rows[0]['number_likes'] = users_uuids.length;
            if (users_uuids.length > 0) {
              con.query('SELECT uuid, nickname FROM users WHERE uuid = ?', [users_uuids[0].user_uuid], (err, users_data) => {
                rows[0]['first_user_like'] = users_data[0];
              });
            }
            con.query('SELECT * FROM comments WHERE post_uuid = ? ORDER BY created_at', [rows[0].uuid], (err, comments_response) => {
              if (comments_response.length > 0) {
                comments_response.map((item, index) => {
                  con.query('SELECT profile_image, name, nickname FROM users WHERE uuid = ? ', [item.user_uuid], (err, image) => {
                    item['user_profile_image'] = image[0].profile_image;
                    item['user_name'] = image[0].name;
                    item['user_nickname'] = image[0].nickname;
                    con.query("SELECT * FROM likes WHERE (post_uuid = ? AND comment_uuid = ?)", [uuid, item.uuid], (err, user_like_comment) => {
                      item['number_likes'] = user_like_comment.length;
                      const likes_comments_by_user = user_like_comment.filter((i) => i.user_uuid === own_user_uuid);
                      const exist_like_comment = likes_comments_by_user.find((i) => i.comment_uuid === item.uuid)
                      if (exist_like_comment !== undefined) {
                        item['like_comment'] = true;
                      } else {
                        item['like_comment'] = false;
                      }
                      if (index === comments_response.length - 1) {
                        rows[0]['comments'] = formatSubcomments(comments_response);
                        return response.status(200).send({
                          status: 'ok',
                          rows
                        });
                      }
                    });
                  });
                });
              } else {
                return response.status(200).send({
                  status: 'ok',
                  rows
                });
              }
            });
          });
        });
      });
    });
  },
  commentPost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      });

      const body = request.body;
      const user_uuid = request.user.uuid;
      const data = {
        uuid: uuid.v4(),
        user_uuid: user_uuid,
        post_uuid: body.post_uuid,
        comment_related_uuid: body.comment_related_uuid,
        comment: body.comment,
        created_at: new Date(),
        updated_at: new Date(),
      };
      con.query('INSERT INTO comments SET ?', [data], (err, rows) => {
        if (err) return response.status(400).send({ message: err });

        con.query('SELECT name, profile_image, nickname FROM users WHERE uuid = ?', [user_uuid], (err, user_data) => {
          data['user_name'] = user_data[0].name;
          data['user_profile_image'] = user_data[0].profile_image;
          data['user_nickname'] = user_data[0].nickname;
          return response.status(200).send({
            status: 'ok',
            data
          });
        })
      })
    });
  },
  deleteCommentPost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      });
      const uuid = request.params.uuid;
      const user_uuid = request.user.uuid;
      con.query('SELECT user_uuid, post_uuid FROM comments WHERE uuid = ?', [uuid], (err, comment) => {
        con.query('SELECT user_uuid FROM posts WHERE uuid = ?', [comment[0].post_uuid], (err, post) => {
          if ((comment[0].user_uuid === user_uuid) || post[0].user_uuid === user_uuid) {
            con.query('DELETE FROM comments WHERE uuid =  ?', [uuid], (err, rows) => {
              if (err) return response.status(400).send({ message: err });
      
              return response.status(200).send({
                status: 'ok',
                message: 'The comment has been deleted successfully',
              });
            });
          } else {
            return response.status(400).send({
              error: 'Access denied'
            });
          }
        });
      });
    });
  },
  getPostTagged: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      });
      const uuid = request.params.uuid;
      con.query("SELECT * FROM posts WHERE tagged LIKE  '%" + uuid + "%' ORDER BY created_at DESC", (err, rows) => {
        if (err) return response.status(400).send({
          message: err
        });

        return response.status(200).send({
          status: 'ok',
          rows
        });
      });
    });
  },
  uploadPost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const files = request.files;

      //CHECKING IF THE FILES IS TOO BIG
      let is_too_big = false;
      for (const file of files) {
        if (file.size > 5000000)
          is_too_big = true
      }

      if (is_too_big) {
        for (const file of files) {
          const { path } = file
          fs.unlinkSync(path);
        }
        return response.status(400).send({ message: 'The file is too big' })
      }

      const uploadImage = async (request) => {
        const uploader = async (path) => await cloudinary.uploads(path, 'socialOC');
        const urls = [];

        if (files.length === 0) return response.status(400).send({ message: 'there is no photo uploaded' })

        for (const file of files) {
          const { path } = file;
          const new_path = await uploader(path);
          urls.push(new_path);
          fs.unlinkSync(path);
        }
        return urls
      }

      const new_post = {
        uuid: uuid.v4(),
        user_uuid: request.user.uuid,
        caption: (request.body.caption) ? request.body.caption : '',
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

          con.query('SELECT name, profile_image FROM users WHERE uuid = ?', [request.user.uuid], (err, rows2) => {
            if (err) return response.status(400).send({
              message: err
            })
            new_post.images = post_updated.images;
            new_post['user_name'] = rows2[0].name;
            new_post['user_profile_image'] = rows2[0].profile_image
            return response.status(200).send({
              message: 'added post',
              new_post
            });
          });
        });
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
          post_updated
        })
      })
    });
  },
  editComment: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const body = request.body;
      const comment = {
        comment: body.comment ? body.comment : null,
        updated_at: new Date()
      }
      con.query('SELECT * FROM comments WHERE uuid = ?', [body.uuid], (err, rows) => {
        if (err) return response.status(400).send({
          message: err
        })
        if (request.user.uuid === rows[0].user_uuid) {
          con.query('UPDATE comments SET ? WHERE uuid = ?', [comment, body.uuid], (err, rows_updated) => {
            if (err) return response.status(400).send({
              message: err
            })
            console.log(comment)
            return response.status(200).send({
              rows_updated,
              comment
            })
          });
        } else {
          return response.status(400).send({
            error: 'Access denied'
          });
        }
      });
    });
  },
  deletePost: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const uuid = request.params.post_uuid;
      con.query('SELECT images, user_uuid FROM posts WHERE uuid = ?', [uuid], (err, rows) => {
        if (request.user.uuid === rows[0].user_uuid) {
          if (rows[0].images.split(',').length > 1) {
            const images = rows[0].images.split(',');
  
            images.forEach((item) => {
              const deleter = async (path) => await cloudinary.delete(path);
              deleter(`socialOC/${item.split('/')[8].split('.')[0]}`)
            })
          } else {
            const images = rows[0].images;
            const deleter = async (path) => await cloudinary.delete(path);
            deleter(`socialOC/${images.split('/')[8].split('.')[0]}`)
          }
          con.query('DELETE FROM posts WHERE uuid = ?', [uuid], (err, rows) => {
            if (err) return response.status(400).send({
              message: err
            })
            return response.status(200).send({
              message: 'Deleted successfully'
            })
          });

        } else {
          return response.status(400).send({
            error: 'Access denied'
          });
        }
      });

    });
  }, 
  getPostFollowers: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      })
      const user_uuid = request.user.uuid;
      con.query('SELECT P.uuid, P.user_uuid, P.caption, P.images, P.tagged, P.updated_at, P.created_at FROM posts P JOIN followers F ON P.user_uuid = F.user_followed_uuid AND F.user_follower_uuid = ? ORDER BY created_at DESC', [user_uuid], (err, rows) => {
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

            con.query('SELECT * FROM likes WHERE post_uuid = ?', [item.uuid], (err, rows3) => {
              const exist_like = rows3.find((item) => item.user_uuid === user_uuid);
              if (exist_like !== undefined) {
                item['like_post'] = { like_post: true, uuid: exist_like.uuid };
              } else {
                item['like_post'] = { like_post: false };
              }
              item['user_name'] = rows2[0].name;
              item['user_profile_image'] = rows2[0].profile_image;
              new_rows.push(item)
              counter += 1

              if (rows.length === counter) {
                return response.status(200).send({
                  status: 'ok',
                  new_rows
                });
              }
            });
          })

        })
      })

    });
  },
  getUsersLikes: (request, response) => {
    request.getConnection((err, con) => {
      if (err) return response.status(400).send({
        message: err
      });

      const type = request.params.type;
      const uuid = request.params.uuid;
      const own_user = request.user.uuid;

      con.query(`SELECT user_uuid FROM likes WHERE ${type === 'post' ? 'post_uuid' : 'comment_uuid'} = ? AND type_like = ?`, [uuid, type], (err, users_uuid) => {
        const users = [];
        users_uuid.map((u, index) => {
          con.query('SELECT uuid, nickname, name, profile_image FROM users WHERE uuid = ?', [u.user_uuid], (err, user) => {
            con.query('SELECT user_followed_uuid FROM followers WHERE user_follower_uuid = ? ', [own_user], (err, following) => {
              user[0]['you_follow'] = following.find((obj) => obj.user_followed_uuid === user[0].uuid) !== undefined;
              users.push(user[0]);
              if (index === users_uuid.length - 1) {
                return response.status(200).send({
                  status: 'ok',
                  users,
                }); 
              }
            });
          });
        });
      });
    });
  }
}

const formatSubcomments = (comments) => {
  comments.forEach((i) => {
    const comments_related = [];
    comments.forEach((j) => {
      if (i.uuid === j.comment_related_uuid) {
        comments_related.push(j);
        i.related_comments = comments_related;
      }
    });
  });
  return comments.filter((item) => item.comment_related_uuid === null);
}


module.exports = mainController;