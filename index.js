var http = require('http');
var url = require('url');
var port = 6555;
var parser = require('feedparser'); 
var querystring = require('querystring');
var jade = require('jade');
var fs = require('fs');
var iconv = require('iconv');
var buffer = require('buffer'); 

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
		action = urlHandler(req,res);
		if(action)
			action(req,res);
		console.log("Got request " + req.url); 
	}).listen(port);
		

	console.log("Listening on port " + port);
});

var urlHandler = function(req,res){
	req.parsedUrl = url.parse(req.url, true);
	switch(req.parsedUrl.pathname){
		case '/favicon.ico':
			res.end();
			return null;
			break;
		case '/':
			return showlatestnews;
			break;
		case '/removeFeed':
			return removeFeed;
			break;
		case '/addFeed':
			return addFeed;
			break;
	}
	return null;
}

var showlatestnews = function(req,res){
	res.setHeader("content-type", "text/html;charset=utf-8");
	collections.articlescollection.find().toArray(function(err, articles){
		console.log(articles.length); 
		var jaded = jade.compile(fs.readFileSync("view/index.jade"), {"pretty" : 1} )
		res.write(jaded({"articles" : articles}));	
		res.end(); 
	});
	//collections.articlescollection.find().each(function(err, article){
		//if(!article){ res.end(); return;}
		//res.write(jade.compile("li")());
	//});
}

var addFeed = function(req,res){
	collections.feedcollection.insert({'url':req.parsedUrl.query.feed});
	res.end();

}

var removeFeed = function(req,res){
	collections.feedcollection.remove({'url':req.parsedUrl.query.feed});
	res.end();

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
