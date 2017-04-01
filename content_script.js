// minimum number of votes to classify something as suspected
var cutoff = 4;

var current_user = $('.user a:first').text();

$("body").on("click", ".suspectpost", function(e) {
    e.preventDefault();
    var packet = {
      accuser_username: current_user,
      suspect_post: $(this).attr('value')
    };
    $(this).text('thanks!');
    $.ajax({
      type: 'POST',
      url: 'https://yogatime.herokuapp.com/api/hail_suspect',
      dataType: 'json',
      data: packet,
      success: function() {
        $(this).text('');
      }
    });
});

$("body").on("click", ".suspectuser", function(e) {
    e.preventDefault();
    var packet = {
      accuser_username: current_user,
      suspect_username: $(this).attr('value')
    };
    $(this).text('unmark shill');
    $.ajax({
      type: 'POST',
      url: 'https://yogatime.herokuapp.com/api/hail_suspect',
      dataType: 'json',
      data: packet
    });
});

$("body").on("click", ".unsuspectuser", function(e) {
    e.preventDefault();
    var packet = {
      accuser_username: current_user,
      unsuspect_username: $(this).attr('value')
    };
    $(this).text('mark shill');
    $.ajax({
      type: 'POST',
      url: 'https://yogatime.herokuapp.com/api/hail_unsuspect',
      dataType: 'json',
      data: packet
    });
});


// A dictionary which will contain as keys the urls of
// the urls that are on r/hailcorporate, with the values
// being the associated upvotes there.
var hail_url_upvotes = {};
var api_url_suspicion = {};
var api_username_suspicion = {};

// Returns gray from 220 to 140 based on upvotes on r/hailcorporate.
// More upvotes -> More probable it's an ad -> blacker color.
// Currently the blackest color is reached with 300 upvotes.
function colorFromVotes(votes) {
  var v = (220 - Math.min(Math.floor(votes/5), 60)).toString();
  return "rgb("+v+","+v+","+v+")";
}

// Same as above but broader, for the api (which will generate more votes per post im supposing).
// 435 votes makes this the darkest it can be (100/255).
function colorFromSuspicion(count) {
  var v = (245 - Math.min(Math.floor(count/3), 145)).toString();
  return "rgb("+v+","+v+","+v+")";
}

function defined(v) {
  return (v !== undefined) && (v !== null) && (v !== "");
}
// Modifies the current pages posts (called on page load and after never-ending-reddit update)
function modifyPosts() {


  // Modify posts.
  $( ".thing" ).each(function(i, thing ) {

            // Grab the post comment section url and username...
            var url = $(thing).find(".entry ul.flat-list li.first a").attr('href');
            var username = $(thing).find(".entry .tagline a.author").text();

            var title = $(thing).find(".entry p.title");


            if(defined(url)) {

              url = url.toLowerCase();
              var flat_list = $(thing).find(".entry ul.flat-list");
              if(defined(api_url_suspicion[url])){

                var count = Math.abs(api_url_suspicion[url]);


                if(count >= cutoff) {
                  $(thing).animate({backgroundColor:colorFromSuspicion(count)},1000);
                }


                // If the user has suspected this post, dont add suspect link.

                if(api_url_suspicion[url] > 0)
                  flat_list.append("<li><a href='' class='suspectpost' value='"+url+"'>mark ad</a></li>");

              } else {
                  flat_list.append("<li><a href='' class='suspectpost' value='"+url+"'>mark ad</a></li>");
                  if(defined(hail_url_upvotes[url])){

                  var votes = hail_url_upvotes[url][0];


                  // And if it matches one on r/hailcorporate,
                  // Prepend "(ad)" to the title and set the post background accordingly.
                  // (more upvoted on r/hailcorporate -> darker background)
                  title.prepend('<a href="'+hail_url_upvotes[url][1]+'">(ad) </a>');
                  $(thing).animate({backgroundColor:colorFromVotes(votes)},1000);
                  }
              }
            }

            if(defined(username)) {
              username = username.toLowerCase();
              var username_line = $(thing).find(".entry .tagline a.author");


              if (defined(api_username_suspicion[username])) {
                var count = api_username_suspicion[username];

                if(Math.abs(api_username_suspicion[username]) >= cutoff) {
                  title.prepend('(shill) ');
                  $(thing).animate({backgroundColor:colorFromSuspicion(Math.abs(count))},1000);
                }


                // Negative count means user has already suspected shill. Add unsuspect link.
                if (count < 0)
                  username_line.after(" (<a style='color:#888' href='' class='unsuspectuser' value='"+username+"'>unmark shill</a>) ");
                if (count >= 0)
                  username_line.after(" (<a style='color:#888' href='' class='suspectuser' value='"+username+"'>mark shill</a>) ");

            } else {
              username_line.after(" (<a style='color:#888' href='' class='suspectuser' value='"+username+"'>mark shill</a>) ");
            }
          }


  });


}


// Fetch the urls from the last week on r/hailcorporate and match them to the current page. Also fetch the stored info from the backend.
$.getJSON(
        "https://www.reddit.com/r/HailCorporate/top/.json?sort=top&t=week&limit=500",
        function foo(data)
        {

          // 1. Get the urls from r/hailcorporate and their upvotes.
          $.each(
            data.data.children,
            function (i, post) {

              // Include results with positive upvotes that are not self posts.
              // (Remember that post.data.ups is fuzzed)
              if(post.data.ups > 1 &&
                 post.data.url.toLowerCase().indexOf("hailcorporate") == -1) {
                var url = post.data.url.toLowerCase()
                url = url.replace("np.reddit", "www.reddit");
                hail_url_upvotes[url] = [post.data.ups,post.data.permalink];
              }
            }
          );


          // Grab all the current pages post-urls and poster-usernames.
          var page_urls = [];
          var page_usernames = [];
          $( ".thing" ).each(function(i, thing ) {

                    var url = $(thing).find(".entry .flat-list li.first a").attr('href');
                    var username = $(thing).find(".entry .tagline a.author").text();
                    if(url !== undefined && url != "")
                      page_urls.push(url.toLowerCase());
                    if(username !== undefined && username != "")
                      page_usernames.push(username.toLowerCase());
          });

          // Match these with backend
          var packet = {
            accuser_username: current_user,
            page_urls: page_urls,
            page_usernames: page_usernames
          };

          $.ajax({
            type: 'POST',
            url: 'https://yogatime.herokuapp.com/api/hail_fetch',
            dataType: 'json',
            data: packet,
            success: function(data) {
              api_url_suspicion = data["suspected_urls"];
              api_username_suspicion = data["suspected_users"];
            }
          })
          .always(function() {
              modifyPosts();
            });





});

// This is for the Reddit enhancement suite. Specifically, it
// re-runs the modifyPosts function if the user loads more links
// through never-ending-reddit.
 document.body.addEventListener('DOMNodeInserted', function(event) {
            if ((event.target.tagName == 'DIV') && (event.target.getAttribute('id') && event.target.getAttribute('id').indexOf('siteTable') != -1)) {
                modifyPosts();
            }
        }, true);



