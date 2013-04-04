$(document).ready(function() { 
	var getNews = function(){
		$.getJSON("/newslist", function(data){
			$("#news").empty();
			$.each(data, function(i, article){
				$li = $('<div>');
				$li.append($('<a>').html(article.title).attr('href', article.link));
				$li.append($('<h5>').html(article.author));
				$li.append($('<h5>').html(article.date));
				$li.append($('<p>').html(article.summary));
				$("#news").append($li);
			});
		});
	}
	
	var getFeedlist = function(){
		$.getJSON("feedlist", function(data){
			$("#feedlist").remove(); 
			$ul = $('<ul id="feedlist">'); 
			$.each(data, function(i, feed){
				$a = $('<a>');
				$a.attr('href', '/');
				$a.html(feed.url); 
				$li = $('<li>').html($a)
				$li.append($('<a href="#">').click(function(){
					$.get("/removeFeed",{"feed" : feed.url}, function(){
						getFeedlist(); 	
						getNews();
					});
					return false;
				}).html(" - x"));
				$ul.append($li);
			});
			$("#menu").append($ul); 
		});
	}
	getFeedlist();
	getNews(); 
	$('#addNewFeed').click(function(){
		$.get("/addFeed", {"feed" : $("#newFeed").val()}, function(){
			getFeedlist(); 	
			getNews();
		});
	});
});
