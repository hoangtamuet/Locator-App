let services = require('../services');
let db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').load();

module.exports.addReview = function (req, res) {
	let location_id = req.params.locationid;
	let payload;
	services.authorize(req.get('jwt'))
		.then((_payload) => {
			payload = _payload;
			return db.connect();
		})
		.then(() => {
			let created_time = Date.now();
			let sql = "INSERT INTO comments (rating, content, created_time, location_id, user_id) VALUES ?"
			let values = [];
			for (let prop in req.body) {
				values.push(req.body[prop]);
			}
			if (values.length < 2) throw new Error("All fields required");
			values.push(created_time);
			values.push(location_id);
			values.push(payload.id);
			return db.insert(sql, [[values]]);
		})
		.then(results => {
			let sql = `SELECT AVG(rating) as avg FROM comments WHERE location_id = "${location_id}"`;
			return db.select(sql);
		})
		.then(results => {
			let sql = `UPDATE locations SET rating = "${results[0].avg}" WHERE id = "${location_id}"`
			db.select(sql);
			services.sendJsonResponse(res, 200, {err: false, msg: "Review added!", data: results});
		})
		.catch(err => {
			console.error(err);
			services.sendJsonResponse(res, 400, {err: true, msg: "" + err});
		});
}


module.exports.reviewsByLocationId = (req, res) => {
	let locationid = req.params.locationid;
	db.connect()
		.then(() => {
			let sql = `SELECT comments.id, users.name, rating, content, created_time, user_id FROM comments
			JOIN users ON comments.user_id = users.id WHERE location_id = "${locationid}"`;
			return db.select(sql);
		})
		.then(reviews => {
			services.sendSuccessResponse(res, reviews);
		})
		.catch(err => {
			console.error(err);
			services.sendFailResponse(res, err);
		})
}

module.exports.reviewDeleteOne = function(req, res) {
	let review_id = req.params.reviewid;
	services.authorize(req.get('jwt'))
		.then((payload) => {
			let user_id = payload.id;
			db.connect()
				.then(() => {
					let sql = `SELECT * FROM comments WHERE id = "${review_id}"`;
					return db.select(sql);
				})
				.then(comments => {
					if (!Array.isArray(comments) || comments.length == 0) throw new Error('Find no comment!')
					else if (comments[0].user_id == user_id) {
						let sql = `DELETE FROM comments WHERE id = "${review_id}"`;
						return db.select(sql);
					}
					else throw new Error('Authentication error!')
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
