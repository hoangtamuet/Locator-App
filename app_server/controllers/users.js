let db = require('../db');
let services = require('../services');

module.exports.usersReadOne = (req, res) => {
    let user;
    let userJwt = req.get('jwt');
    services.authorize(userJwt)
        .then(payload => {
            db.connect()
              .then(() => {
                  let sql = `SELECT id, name, email FROM users WHERE email = "${payload.email}"`;
                  return db.select(sql);
              })
              .then(users => {
                  if (!Array.isArray(users) && users.length != 1) throw new Error("No user found!");
                  user = users[0];
                  let id = user.id;
                  let sql = `SELECT locations.name, comments.id, comments.location_id, comments.rating, content, created_time FROM comments JOIN locations ON comments.location_id = locations.id WHERE user_id="${id}"`;
                  return db.select(sql);
              })
              .then(_comments => {
                let comments = [];
                _comments.forEach((_comment) => {
                    comments.push(_comment);
                })
                user.comments = comments;
                services.sendSuccessResponse(res, user);
              })
              .catch(err => {
                console.error(err);
                services.sendFailResponse(res, err);
              });
        })
        .catch(err => {
            console.error(err);
            services.sendFailResponse(res, err);
        });
}

module.exports.usersUpdateOne = (req, res) => {
    services.authorize(req.get('jwt'))
        .then((payload) => {
            let user_id = payload.id;
            let newName = req.body['name'];
            let newEmail = req.body['email'];
            let newPassword = req.body['password'];
            db.connect()
                .then(() => {
                    if (!newName || !newEmail) throw new Error('All fields required');
                    let sql = `SELECT * from users WHERE email = "${newEmail}"`;
                    return db.select(sql);
                })
                .then(users => {
                    if (users.length >= 1 && newEmail != payload.email) {
                        throw new Error('Email existed already');
                    }
                    else if (req.body['password'] != undefined) {
                        let hash = services.generateHash(newPassword);
                        let sql = `UPDATE users SET name = "${newName}", email = "${newEmail}", password = "${hash.password}", salt = "${hash.salt}" WHERE id = "${user_id}"`;
                        return db.insert(sql);
                    }
                    else if (req.body['password'] == undefined) {
                        let sql = `UPDATE users SET name = "${newName}", email = "${newEmail}" WHERE id = "${user_id}"`;
                        return db.insert(sql);
                    }
                })
                .then(results => {
                    services.sendSuccessResponse(res, null);
                })
                .catch(err => {
                    console.error(err);
                    services.sendFailResponse(res, err);
                });
        })
        .catch(err => {
			console.error(err);
			services.sendJsonResponse(res, 400, {err: true, msg: "" + err});
		});
}