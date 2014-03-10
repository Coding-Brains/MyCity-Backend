function WardsDAO(db,BSON){
	var wards = db.collection("wards");
	this.getCouncillorDetails = function(area, location, street, callback) {
		var _id = {
			area : area,
			location : location,
			street : street
		};
		var query = {'_id':_id};
		console.log('query = %j',query);
		var projection = {'_id':0};
		wards.findOne(query,projection,function(err,doc){
			if(err){
				console.log('error');
				var err = {'err':'Location not found. Pls try again.'}
				callback(err,null);
			}
			callback(null,doc);
		});
	}

	this.getWardDetails = function(division,callback){
		var query = {'division':division};
		console.log(db);
		db.collection("wards").find(query,function(err,ward){
			if(err){
				var err = {'err':'Unable to get ward details for division '+division}
				callback(err,null);
			}
			callback(null,ward);
		})
	}
}

module.exports.WardsDAO = WardsDAO;