function ComplaintsDAO(db,BSON){
	var complaints = db.collection("complaints");
	
	// Create a complaint
	this.insertComplaint = function(complaintDocument, callback) {
		var resp = {'msg':'Your complaint has been submitted for processing'};
		complaints.insert(complaintDocument,function(err,doc){
			if(err){
				resp = {'err':'Complaint not registered successfully. Pls try again.'}
				callback(null,resp);
			}
			callback(resp,null);
		})
	}

	this.getAllComplaints = function(callback){
		var resp = {'msg':'Retrieved All the complaints'};
		complaints.find().toArray(function(err,items){
			if(err){
				resp = {'err':'Error in getting all the complaints'};
				callback(resp,null);
			}
			callback(null,items);
		});
	}
	
	this.isMailSent = function(complaintId,isMailSent,callback){
		var resp = {'msg':'isMailSent status updated'};
		complaints.update({'_id':new BSON.ObjectID(complaintId)},{$set: {'isMailSent':isMailSent}},function(err,result){
			if(err){
				resp = {'msg':'Updating isMailSent falied'};
				callback(resp,null);
			}
			callback(null,resp);
		});
	}

	this.isMsgSent = function(complaintId,isMsgSent,callback){
		var resp = {'msg':'isMsgSent status updated'};
		complaints.update({'_id':new BSON.ObjectID(complaintId)},{$set: {'isMsgSent':isMailSent}},function(err,result){
			if(err){
				resp = {'msg':'Updating isMailSent falied'};
				callback(resp,null);
			}
			callback(null,resp);
		});
	}

	this.updateStatus = function(complaintId,complaintStatus,callback){
		var resp = {'msg':'Complaint status updated'};
		complaints.update({'_id':new BSON.ObjectID(complaintId)},{$set: complaintStatus},function(err,result){
			if(err){
				resp = {'msg':'Updating complaint falied'};
				callback(resp,null);
			}
				callback(null,resp);
		});
	};

	this.getComplaintById = function(complaintId,callback){
		var resp = {'msg':'Retrieved the individual complaint'};
		complaints.findOne({'_id':new BSON.ObjectID(complaintId)},{},function(err,item){
			if(err){
				resp = {'err':'Error in getting all the complaints'};
				callback(resp,null);
			}
			callback(null,item);
		});
	};

	this.filterComplaints = function(filterQuery,callback){
		var resp = {'msg':'Filtering the complaints'};
		complaints.find(filterQuery,{}).toArray(function(err,items){
			if(err){
				resp = {'msg':'Cannot Filter using the given filter query :'+filterQuery};
				callback(resp,null);
			}
			callback(null,items);
		});
	}

	this.groupByComplaintType = function(callback){
		var pipeline = [{
			$group : {
 				_id: '$complaintType',
 				count : {$sum : 1}
 			}
		}];
		console.log("%j",pipeline);
		complaints.aggregate(pipeline,function(err,doc){
			if(err) throw err;
			callback(err,doc)
		});
	}

	this.groupByComplaintStatus = function(callback){
		var pipeline = [
			{
				$match : {
					area : 'Perungudi'
				}
			},
			{
				$group : {
 					_id: '$status',
 					count : {$sum : 1}
 				}
			}
		];
		complaints.aggregate(pipeline,function(err,doc){
			if(err) throw err;
			console.log("doc = %j",doc);
			callback(err,doc)
		});
	}
}

module.exports.ComplaintsDAO = ComplaintsDAO;