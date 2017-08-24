# Timeline
An interactive, timeline-based view to Wikipedia articles. We'll be pulling content from Wikipedia, parsing the content for dates and adding those dates as items to a timeline using Vis.js.

Pull content from Wikipedia.

`Section:0` - specifies the intro text. Remove section option to get full content.

```
$.ajax({
    url: "https://en.wikipedia.org/w/api.php",
    data: {
        format: "json",
        action: "parse",
        page: "Ahmedabad",
        prop:"text",
        section:0,
    },
    dataType: 'jsonp',
    headers: {
        'Api-User-Agent': 'MyCoolTool/1.1 (http://example.com/MyCoolTool/; MyCoolTool@example.com) BasedOnSuperLib/1.4'
    },
    success: function (data) {
      console.log(data)        
      var markup = data.parse.text["*"];
      var i = $('<div></div>').html(markup);

      // remove links as they will not work
      i.find('a').each(function() { $(this).replaceWith($(this).html()); });

      // remove any references
      i.find('sup').remove();

      // remove cite error
      i.find('.mw-ext-cite-error').remove();

      $('#article').html($(i).find('p'));
    }
});

```

Alternative method:
```
$(document).ready(function(){
 
    $.ajax({
        type: "GET",
        url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=Jimi_Hendrix&callback=?",
        contentType: "application/json; charset=utf-8",
        async: false,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
 
            var markup = data.parse.text["*"];
            var blurb = $('<div></div>').html(markup);
 
            // remove links as they will not work
            blurb.find('a').each(function() { $(this).replaceWith($(this).html()); });
 
            // remove any references
            blurb.find('sup').remove();
 
            // remove cite error
            blurb.find('.mw-ext-cite-error').remove();
            $('#article').html($(blurb).find('p'));
 
        },
        error: function (errorMessage) {
        }
    });
});

```

Arrange data in JSON array and write to page.

Add Vis.js to `body`.

```
<body>
<div id="visualization"></div>

<script type="text/javascript">
  // DOM element where the Timeline will be attached
  var container = document.getElementById('visualization');

  // Create a DataSet (allows two way data-binding)
  var items = new vis.DataSet([
    {id: 1, content: 'item 1', start: '2013-04-20'},
    {id: 2, content: 'item 2', start: '2013-04-14'},
    {id: 3, content: 'item 3', start: '2013-04-18'},
    {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
    {id: 5, content: 'item 5', start: '2013-04-25'},
    {id: 6, content: 'item 6', start: '2013-04-27'}
  ]);

  // Configuration for the Timeline
  var options = {};

  // Create a Timeline
  var timeline = new vis.Timeline(container, items, options);
</script>
</body>
```
