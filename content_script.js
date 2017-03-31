

// A dictionary which will contain as keys the urls of
// the urls that are on r/hailcorporate, with the values
// being the associated upvotes there.
var hail_url_upvotes = {};

// Returns gray from 220 to 140 based on upvotes on r/hailcorporate.
// More upvotes -> More probable it's an ad -> blacker color.
// Currently the blackest color is reached with 300 upvotes.
function colorFromVotes(votes) {
  var v = (220 - Math.min(Math.floor(votes/5), 60)).toString();
  return "rgb("+v+","+v+","+v+")";
}

// Modifies the current pages posts (called on page load and after never-ending-reddit update)
function modifyPosts() {
  // For each post (thing) ...
  $( ".thing" ).each(function(i, thing ) {

            // Grab the post comment section url...
            var url = $(thing).find(".entry .flat-list li.first a").attr('href')
            if(typeof url !== "undefined" &&
               typeof hail_url_upvotes[url.toLowerCase()] !== "undefined" ) {
              var votes = hail_url_upvotes[url.toLowerCase()][0];
              var title = $(thing).find(".entry p.title");

              // And if it matches one on r/hailcorporate,
              // Prepend "(ad)" to the title and set the post background accordingly.
              // (more upvoted on r/hailcorporate -> darker background)
              title.prepend('<a href="'+hail_url_upvotes[url.toLowerCase()][1]+'">(ad) </a>');
              $(thing).animate({backgroundColor:colorFromVotes(votes)},1000);
            }
          });
}


// Fetch the urls from the last week on r/hailcorporate and match them to the current page.
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

          // 2. Modify posts.
          modifyPosts();



});

// This is for the Reddit enhancement suite. Specifically, it
// re-runs the modifyPosts function if the user loads more links
// through never-ending-reddit.
 document.body.addEventListener('DOMNodeInserted', function(event) {
            if ((event.target.tagName == 'DIV') && (event.target.getAttribute('id') && event.target.getAttribute('id').indexOf('siteTable') != -1)) {
                modifyPosts();
            }
        }, true);



