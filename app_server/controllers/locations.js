let db = require('../db');

let sendJsonResponse = function (res, status, content) {
	res.status(status);
	res.json(content);
};

module.exports.locationList = function (req, res) {
	let type = req.params.type;
	if (type != 'study' && type != 'work' && type != 'dating') {
		sendJsonResponse(res, 400, {err: true, msg: 'Url not found'});
		return;
	}
	let sql = `SELECT * FROM locations where type = "${type}"`;
	db.connect().then((connection) => {
		connection.query(sql, (err, results, fields) => {
			if (err) sendJsonResponse(res, 400, { err: true, msg: err });
			else {
				let locations = results;
				let sql2 = "SELECT * FROM keywords";
				connection.query(sql2, (err2, results2, fields2) => {
					if (err2) sendJsonResponse(res, 400, { err: true, msg: err2 });
					else {
						let currentIndex = 0;
						locations.forEach((location) => {
							location.keywords = [];
							for (let i = currentIndex; i < results2.length; i++) {
								if (results2[i].location_id == location.id) location.keywords.push(results2[i].keyword);
								else if (results2[i].location_id > location.id) {
									currentIndex = i;
									break;
								}
							}
						});
						let sql3 = "SELECT * FROM opening_times";
						connection.query(sql3, (err3, results3, field3) => {
							if (err3) sendJsonResponse(res, 400, { err: true, msg: err3 });
							else {
								let currentIndex = 0;
								locations.forEach((location) => {
									location.openingTimes = [];
									for (let i = currentIndex; i < results3.length; i++) {
										if (results3[i].location_id == location.id) location.openingTimes.push(results3[i]);
										else if (results3[i].location_id > location.id) {
											currentIndex = i;
											break;
										}
									}
								});
								sendJsonResponse(res, 200, locations);
							}
						});
					}
				});
			}
		});
	});
}

module.exports.addLocation = function (req, res) {
	let connect, location_id;
	db.connect()
		.then((connection) => {
			connect = connection;
			let sql = "INSERT INTO locations (name, type, address, rating, longitude, latitude, discount) VALUES ?"
			let values = [];
			for (let value in req.body) {
				if (value == 'keywords' || value == 'openingTimes') continue;
				values.push(req.body[value]);
			}
			return db.insert(sql, [[values]], connect);
		})
		.then((results) => {
			location_id = results.insertId;
			let sql = "INSERT INTO keywords (keyword, location_id) VALUES ?";
			let values = [];
			if (!req.body.keywords || !Array.isArray(req.body.keywords)) throw new Error("keywords is not an array");
			req.body.keywords.forEach((keyword) => {
				let value = [keyword, location_id];
				values.push(value);
			});
			return db.insert(sql, [values], connect);
		})
		.then((results) => {
			let sql = "INSERT INTO opening_times (day, state, open, close, location_id) VALUES ?";
			let values = [];
			if (!req.body.openingTimes || !Array.isArray(req.body.openingTimes)) throw new Error("opening_times is not an array");
			req.body.openingTimes.forEach((openingTime) => {
				let value = [openingTime.day, openingTime.state, openingTime.open, openingTime.close, location_id];
				values.push(value);
			});
			return db.insert(sql, [values], connect);
		})
		.then(results => {
			sendJsonResponse(res, 200, {err: false, msg: "Location has just added!"});
		})
		.catch(err => {
			console.log(err);
		});
}

module.exports.locationsReadOne = function (req, res) {
	let id = req.params.locationid;
	if (!req.params) {
		sendJsonResponse(res, 400, {err: true, msg: 'ID not found'});
		return;
	}
	let sql = `SELECT * FROM locations WHERE id="${id}"`;
	db.connect().then((connection) => {
		connection.query(sql, (err, results, fields) => {
			if (err) sendJsonResponse(res, 400, { err: true, msg: 'Cannot find location' });
			else {
				let locations = results;
				let sql2 = `SELECT * FROM keywords WHERE location_id="${id}"`;
				connection.query(sql2, (err2, results2, fields2) => {
					if (err2) sendJsonResponse(res, 400, { err: true, msg: err2 });
					else {
						let currentIndex = 0;
						locations.forEach((location) => {
							location.keywords = [];
							for (let i = currentIndex; i < results2.length; i++) {
								if (results2[i].location_id == location.id) location.keywords.push(results2[i].keyword);
								else if (results2[i].location_id > location.id) {
									currentIndex = i;
									break;
								}
							}
						});
						let sql3 = `SELECT * FROM opening_times WHERE location_id="${id}"`;
						connection.query(sql3, (err3, results3, field3) => {
							if (err3) sendJsonResponse(res, 400, { err: true, msg: err3 });
							else {
								let currentIndex = 0;
								locations.forEach((location) => {
									location.openingTimes = [];
									for (let i = currentIndex; i < results3.length; i++) {
										if (results3[i].location_id == location.id) location.openingTimes.push(results3[i]);
										else if (results3[i].location_id > location.id) {
											currentIndex = i;
											break;
										}
									}
								});
								sendJsonResponse(res, 200, locations);
							}
						});
					}
				});
			}
		});
	});
}