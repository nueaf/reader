

var http = require('http');
var port = 6555;
var parser = require('feedparser'); 

var mongodb = require('mongodb');
var server = new mongodb.Server("127.0.0.1", 27017, {auto_reconnect : true});
var db = new mongodb.Db('reader', server, {safe:false});
var collections = {};
db.open(function(error, client){
	collections.articlescollection = new mongodb.Collection(client, "articles");
	collections.feedcollection = new mongodb.Collection(client, "feeds");
	fetchnews();
	setInterval(fetchnews, 60000);
	

	http.createServer(function(req, res){
		action = urlHandler(req.url);
		if(action)
			action(req,res);
		console.log("Got request"); 
	}).listen(port);
		

	console.log("Listening on port " + port);
});

var urlHandler = function(url){
	switch(url){
		case '/favicon.ico':
			return null;
			break;
		case '/':
			return showlatestnews;
			break;
	}
	return null;
}

var showlatestnews = function(req,res){
	res.setHeader("content-type", "text/html");
	collections.articlescollection.find().each(function(err, article){
		if(!article){ res.end(); return;}
		res.write(article.title + "<br />");
	});
}

var fetchnews = function(feedcollection, articlescollection){
		console.log("Fetching the news"); 
		collections.feedcollection.find().each(function(err,feed){
			if(feed){
				console.log("Fetching news from " + feed.url); 
				parser.parseUrl(feed.url).on('article', function(article){
					article.feed_id = feed._id;
					collections.articlescollection.find({"guid" : article.guid}).count(function(err, count){
						if(!count)
							collections.articlescollection.insert(article, function(){});
					});				
				});
			}
		});
		
	}
