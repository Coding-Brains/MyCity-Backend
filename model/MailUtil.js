function MailUtil(nodemailer){

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "XXX",
        pass: "XXX"
    }
});

this.sendComplaintEmail = function(complaint){

    var councillor = complaint.councillor;
    var complaintHtmlBody = "<p>"+complaint.title+"</p>"+
    "<p><img src='complaintImageUrl/"+complaint.image+"' style=\"width:600px;height:500px\"/></p>"+
    "<p>"+complaint.complaintType+"</p>"+
    "<p>"+complaint.desc+"</p>"+
    "<p>"+complaint.zone+"</p>"+
    "<p>"+complaint.division+"</p>"+
    "<p>"+complaint.area+"</p>"+
    "<p>"+complaint.location+"</p>"+
    "<p>"+complaint.street+"</p>";

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: "XXX", // sender address
        to: councillor.email, // list of receivers
        subject: complaint.title, // Subject line
        html: complaintHtmlBody // html body
    }

    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log("Error: %j",error);
        }else{
            console.log("Message sent: %j",response);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        smtpTransport.close(); // shut down the connection pool, no more messages
    });

}

}

module.exports.MailUtil = MailUtil;

