// Resources required for the application
var express = require("express")
	,app = express()
	,mongodb = require("mongodb")
	,ComplaintsDAO = require('./model/complaints').ComplaintsDAO
	,consolidate = require("consolidate")
	,WardsDAO = require('./model/wards').WardsDAO
	,MongoClient = mongodb.MongoClient
	,Server = mongodb.Server
	,BSON = mongodb.BSONPure
	,path = require('path')
	,nodemailer = require("nodemailer")
	,twilio = require("twilio")
	,MailUtil = require('./model/MailUtil').MailUtil
	,SmsUtil = require('./model/SmsUtil').SmsUtil
	,googleTranslate = require('google-translate')('gTranslate_key','2');

// Express middleware to populate 'req.body' so we can access POST variables
app.use(express.bodyParser());

// Configure database connection
var mongoclient = new MongoClient(new Server('localhost','27017'),{'native_parser' : true});
var db = mongoclient.db('mycity');

var complaints = new ComplaintsDAO(db,BSON);
var wards = new WardsDAO(db,BSON);
var mailUtil = new MailUtil(nodemailer);
var smsUtil = new SmsUtil(twilio,googleTranslate);

// all environments
app.set('port', process.env.PORT || 8081);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Get ward details
app.get('/ward/:division',function(req,res){
	var division = req.params.division;
	wards.getWardDetails(division,function(err,ward){
		if(err){
			res.send(err);
			return;
		}
		res.send(ward);
	});
});

// Get All Complaints
app.get('/complaints',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	complaints.getAllComplaints(function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve all complaints'});
		}
		res.send(items);
	});
});

// Get Submitted Complaints
app.get('/complaint/submitted',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var filterQuery = {status:'SUB'};
	complaints.filterComplaints(filterQuery,function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve submitted complaints'});
		}
		res.send(items);
	});
});

// Get Acknowledged Complaints
app.get('/complaint/acknowledged',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var filterQuery = {status:'ACK'};
	complaints.filterComplaints(filterQuery,function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve acknowledged complaints'});
		}
		res.send(items);
	});
});

// Get Complaints By Area
app.get('/complaint/area/:area',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var filterQuery = {area:req.params.area};
	complaints.filterComplaints(filterQuery,function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve acknowledged complaints'});
		}
		res.send(items);
	});
});

// Get Complaints By Type
app.get('/complaint/filter/:complaintType',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var filterQuery = {complaintType:req.params.complaintType};
	complaints.filterComplaints(filterQuery,function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve acknowledged complaints'});
		}
		res.send(items);
	});
});

// Get Complaints By User
app.get('/complaint/user/:user',function(req,res){
	console.log("Entering complaint user "+req.params.user);
	res.header('Access-Control-Allow-Origin', "*");
	var filterQuery = {user:req.params.user};
	complaints.filterComplaints(filterQuery,function(err,items){
		if(err){
			res.send({'msg':'Could not retrieve acknowledged complaints'});
		}
		res.send(items);
	});
});

// Get Complaints By Complaints ID
app.get('/complaint/byId/:complaintId',function(req,res){
	console.log("Entering complaint user "+req.params.user);
	var complaintId = req.params.complaintId;
	complaints.getComplaintById(complaintId,function(err,item){
		if(err){
			res.send({'msg':'Could not retrieve acknowledged complaints'});
		}
		res.send(item);
	});
});

app.post('/complaint/ack',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var complaintId = req.body.complaintId;
	var ackStatus = {'status':'ACK'};
	complaints.getComplaintById(complaintId,function(err,complaint){
		if(err)
			res.send(err);
		
			mailUtil.sendComplaintEmail(complaint,function(err,success){
				if(err)
					res.send(err);
				complaints.isMailSent(true,function(err,doc){
					console.log("isMailSent updated");
				})
			});

			smsUtil.sendComplaintSMS(complaint,function(err,success){
				if(err)
					res.send(err);
				complaints.isMsgSent(true,function(err,doc){
					console.log("isMsgSent updated");
				})
			});

			complaints.updateStatus(complaintId,ackStatus,function(err,result){
				if(err){
					res.send(err);
				}
			res.send(result);
			});

	});

});

app.post('/complaint/rej',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var ackStatus = {'status':'REJ'};
	var complaintId = req.body.complaintId;
	complaints.updateStatus(complaintId,ackStatus,function(err,result){
		if(err){
			res.send(err);
		}
		res.send(result);
	});
});

// Create complaint
app.post('/complaint/create', function(req,res){
	// Extract the information in request body
	var area = req.body.area;
	var location = req.body.location;
	var street = req.body.street;
	var user = req.body.user;
	var image = req.body.image;
	var title = req.body.title;
	var desc = req.body.desc;
	var complaintType = req.body.complaintType;
	var division = "";
	var zone = "";
	// Look for councillor information in Ward Collection
	wards.getCouncillorDetails(area,location,street,function(err,ward){
		if(err){
			res.send(err);
		}
		console.log("ward = %j",ward);
		zone = ward.zone;
		division = ward.division;
		councillor = ward.councillor;
		// Construct a complaint document
		var complaintDocument = {
			complaintType : complaintType,
			image : image,
			status : 'SUB',
			isMailSent : false,
			isMsgSent : false,
			division : division,
			zone : zone,
			councillor : councillor,
			area : area,
			location : location,
			street : street,
			title : title,
			desc : desc,
			user : user
		}
		console.log("complaint doc = %j",complaintDocument);
		complaints.insertComplaint(complaintDocument,function(err,doc){
			if(err) res.send(err);
			res.send(doc);
			res.end();
		});
	});
});

// Generate report based on complaint categories
app.get('/complaint/typeGrouping',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var chartData = [];
	complaints.groupByComplaintType(function(err,resp){
		if(err) res.send(err);
		var singleEntry = [];
		console.log("resp = %j",resp);
		resp.forEach(function(doc,i){
			console.log("doc = %j",doc);
			singleEntry.push(doc._id);
			singleEntry.push(doc.count);
			chartData.push(singleEntry);
			singleEntry = [];
		});
		res.send(chartData);
	});
});

// Generate report based on complaint categories
app.get('/complaint/statusGrouping',function(req,res){
	res.header('Access-Control-Allow-Origin', "*");
	var chartData = [];
	complaints.groupByComplaintStatus(function(err,resp){
		if(err) res.send(err);
		var singleEntry = [];
		console.log("resp = %j",resp);
		resp.forEach(function(doc,i){
			console.log("doc = %j",doc);
			singleEntry.push(doc._id);
			singleEntry.push(doc.count);
			chartData.push(singleEntry);
			singleEntry = [];
		});
		res.send(chartData);
	});
});

// Any requests which is not handled by above handlers
app.get('*', function(req,res){
	res.send("Page not found");
});

// Connect to db first before 
mongoclient.open(function(err,mongoclient){
	// Listen at port 8081
	// If the port is in already in use, 
	// node server throws 'listen EADDRINUSE'
	app.listen(8081);
	console.log("Express server started at 8081");
});