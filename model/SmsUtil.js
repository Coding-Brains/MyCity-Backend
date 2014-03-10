function SmsUtil(twilio,googleTranslate){

	var accountSid = "XXX";
	var authToken = "XXX";
	var client = new twilio.RestClient(accountSid, authToken);
	
	this.sendComplaintSMS = function(complaint){

		var councillor = complaint.councillor;
		var textToTranslate = "Issue Type:"+complaint.complaintType+"..Place:"+complaint.street;
		googleTranslate.translate(textToTranslate, 'ta', function(err, translation) {

			console.log("Error :"+err);
			var smsOptions = {
	    		body: translation.translatedText,
	    		to: "XXX",
	    		from: "XXX"
			}
		
			client.sms.messages.create(smsOptions, function(err, message) {
	    		if(err){
            		console.log("Error: %j",err);
        		}
			});

		});
	}
}

module.exports.SmsUtil = SmsUtil;