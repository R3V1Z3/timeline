/* global $, jQuery, location, hljs, HtmlWhitelistedSanitizer, URLSearchParams, URL */
var TOC = [];
var toggle_html='<span class="toggle">-</span>';

let params = (new URL(location)).searchParams;
var path = window.location.pathname.split('index.html')[0];

// allow user to override fontsize
var fontsize = params.get('fontsize');
if (fontsize) {
    $('#wrapper').css('font-size', fontsize + '%');
}

var gist_filename = 'README.md';
var css_filename = 'Default';

var page = '';
if( params.has('page') ) {
    page = params.get('page');
}

jQuery(document).ready(function() {
    
    if (page === ''){
        throw new Error("Include page= parameter in url to continue.");
    }
    
    $('#info').show();
    
    // allow custom Gist
    var gist = params.get('gist');
    
    // pull content
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        data: {
            format: "json",
            action: "parse",
            page: "Ahmedabad",
            prop: "text",
            section: 0,
        },
        dataType: 'jsonp',
        success: function (data) {
          console.log(data);
          
          var markup = data.parse.text["*"];
          var i = $('<div></div>').html(markup);
    
          // remove links as they will not work
          //i.find('a').each(function() { $(this).replaceWith($(this).html()); });
    
          // remove any references
          i.find('sup').remove();
    
          // remove cite error
          i.find('.mw-ext-cite-error').remove();
          $('#inner').remove();
          $('#outer').append('<div id="content"</div>');
          $('#content').html($(i).find('p'));
          su_render(data);
        }
    });
    
    // allow for custom CSS via Gist
    var css = params.get('css');
    var cssfilename = params.get('cssfilename');
    if (css && css != 'default') {
        $.ajax({
            url: 'https://api.github.com/gists/' + css,
            type: 'GET',
            dataType: 'jsonp'
        }).success(function(gistdata) {
            var objects = [];
            if (!cssfilename) {
                for (var file in gistdata.data.files) {
                    if (gistdata.data.files.hasOwnProperty(file)) {
                        // get filename
                        css_filename = gistdata.data.files[file].filename;
                        // get file contents
                        var o = gistdata.data.files[file].content;
                        if (o) {
                            objects.push(o);
                        }
                    }
                }
            }
            else {
                objects.push(gistdata.data.files[cssfilename].content);
            }
            render_css(objects[0]);
        }).error(function(e) {
            console.log('Error on ajax return.');
        });
    }
    
    // update index.html details so project can be safely forked without any changes
    function update_index(){
        var url = 'https://github.com' + path + '#cheats';
        $('#github-fork').attr('href', url);
    }
    
    // get examples from README.md and render them to selectors
    function update_selectors(data){
        var processed = '';
        var lines = data.split('\n');
        var gist_found = false;
        var css_found = false;
        $.each( lines, function( i, val ) {
            if ( val.indexOf('## Example Gists') != -1 ){
                gist_found = true;
                css_found = false;
                processed = '<input id="gist-input" type="text" placeholder="Gist ID" />';
                processed += '<a href="https://github.com' + path + 'blob/master/README.md" target="_blank">↪</a>';
                processed += '<span id="default">Default (README.md)</span><br/>';
            }
            if ( val.indexOf('## Example CSS Themes') != -1 ){
                // css section found so let update the gist selector with processed info
                $('#gist-selector').html(processed);
                processed = '<input id="css-input" type="text" placeholder="Gist ID for CSS theme" />';
                processed += '<a href="https://github.com' + path + 'blob/master/css/style.css" target="_blank">↪</a>';
                processed += '<span id="default">Default (style.css)</span><br/>';
                css_found = true;
                gist_found = false;
            }
            if ( val.indexOf('- [') != -1 ) {
                if ( gist_found ){
                    // item found and it's from gist example group
                    var x = val.split(' [')[1];
                    var name = x.split('](')[0];
                    x = x.split('gist=')[1];
                    var id = x.split( ') -' )[0];
                    processed += '<a href="https://gist.github.com/' + id + '" target="_blank">↪</a>';
                    processed += '<span id="' + id + '">' + name + '</span><br/>';
                } else if ( css_found ) {
                    // item is from css example group
                    var x = val.split('- [')[1];
                    var name = x.split('](')[0];
                    x = x.split('css=')[1];
                    var id = x.split( ') -' )[0];
                    processed += '<a href="https://gist.github.com/' + id + '" target="_blank">↪</a>';
                    processed += '<span id="' + id + '">' + name + '</span><br/>';
                }
            }
            $('#css-selector').html(processed);
        });
        return processed;
    }
    
    // fancy super user renderer function :)
    function su_render(data) {
        render(data);
        render_info();
        render_extra();
        jump_to_hash();
        register_events();
        
        // hide selectors at start
        $('#info .selector').hide();
    }
    
    function jump_to_hash() {
        // now with document rendered, jump to user provided url hash link
        var hash = location.hash;
        if( hash && $(hash).length > 0 ) {
            // scroll to location
            $('body').animate({
                scrollTop: $(hash).offset().top
            });
        }
    }
    
    function render_css(css) {
        // attempt to sanitize CSS so hacker don't splode our website
        var parser = new HtmlWhitelistedSanitizer(true);
        var sanitizedHtml = parser.sanitizeString(css);
        $('head').append('<style>' + sanitizedHtml + '</style>');
        // update info panel
        render_info();
    }

    function render(content) {
        
        // var md = window.markdownit({
        //     html: false, // Enable HTML tags in source
        //     xhtmlOut: true, // Use '/' to close single tags (<br />).
        //     breaks: true, // Convert '\n' in paragraphs into <br>
        //     langPrefix: 'language-', // CSS language prefix for fenced blocks.
        //     linkify: true,
        //     typographer: true,
        //     quotes: '“”‘’',
        //     highlight: function(str, lang) {
        //         if (lang && hljs.getLanguage(lang)) {
        //             try {
        //                 return '<pre class="hljs"><code>' +
        //                     hljs.highlight(lang, str, true).value +
        //                     '</code></pre>';
        //             }
        //             catch (__) {}
        //         }
        //         return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        //     }
        // });
        // $('#wrapper').html( md.render(content) );
    }
    
    function css_name(str) {
        str = str.toLowerCase();
        // remove non-alphanumerics
        str = str.replace(/[^a-z0-9_\s-]/g, '-');
        // clean up multiple dashes or whitespaces
        str = str.replace(/[\s-]+/g, ' ');
        // remove leading and trailing spaces
        str = str.trim();
        // convert whitespaces and underscore to dash
        str = str.replace(/[\s_]/g, '-');
        return str;
    }
    
    function render_info() {
        
        // render TOC
        render_toc_html();
        
        // command count
        var current = $('#command-count').text();
        current = current.split(' total')[0];
        render_count(current);
        
        // update gist and css urls
        var url = '';
        if (gist) {
            url = 'https://gist.github.com/' + gist;
            $('#gist-url').text('▼ ' + gist_filename);
        } else {
            url = 'https://github.com' + path + 'blob/master/README.md';
        }
        $('#gist-source').attr('href', url);
        
        if (css) {
            url = 'https://gist.github.com/' + css;
            $('#css-url').text('▼ ' + css_filename);
        } else {
            url = 'https://github.com' + path + 'blob/master/css/style.css';
        }
        $('#css-source').attr('href', url);
    }
    
    function render_toc_html() {
        var html = '';
        // iterate section classes and get id name to compose TOC
        $( '#commands .section' ).each(function() {
            var name = $(this).attr('id');
            var toggle_hidden = '';
            if ( $('#' + name).is(':hidden') ){
                toggle_hidden ='class="hidden"';
            }
            html += '<a href="#' + name + '" ' + toggle_hidden + '>';
            html += name;
            html += toggle_html;
            html += '</a>';
        });
        $('#toc').html( html );
        
        // add click event to items
        $( "#toc .toggle" ).click(function() {
            var name = $(this).parent().attr('href');
            // toggle hidden status
            if( $(this).parent().hasClass('hidden') ) {
                $(name).show();
                $(this).parent().removeClass('hidden');
            } else {
                $(name).hide();
            }
            render_toc_html();
        });
    }
    
    function render_extra() {
        // hide sections and toc reference when toggled
        $( ".section .toggle" ).click(function() {
            var name = $(this).parent().attr('name');
            $('#' + name).hide();
            render_toc_html();
        });
    }
    
    function render_count(element) {
        var count = $( '#wrapper ' + element ).length;
        $('#command-count').html('<code>' + element + '</code>' + ' total: ' + count);
    }
    
    function register_events() {
        
        // commmand count
        $('#command-count').click(function() {
            var count_array = ['.section','kbd','li','code'];
            // get current count option
            var current = $('#command-count').text();
            current = current.split(' total')[0];
            
            // find current item in count_array
            var x = count_array.indexOf(current);
            // increment current item
            if ( x === count_array.length - 1 ) {
                x = 0;
            } else {
                x += 1;
            }
            current = count_array[x];
            render_count(current);
        });
        
        // event handler to toggle info panel
        $('#hide').click(function() {
            $('#info').toggle();
        });
        
        // close input panel when wrapper is clicked
        $('#input-wrapper').on('click', function (e) {
            if ( $(e.target).closest("#input-panel").length === 0 ) {
                $(this).hide();
            }
        });
        
        // Key events
        $(document).keyup(function(e) {
            if( e.which == 191 ) {
                // ? for help
                $('#info').toggle();
            } else if (e.keyCode === 27) {
                // Escape
                $('.selector').hide();
            }
        });
        
        $('#gist-input').keyup(function(e) {
            if( e.which == 13 ) {
                params.set( 'article', $(this).val() );
                window.location.href = uri();
            }
        });
        
        $('#css-input').keyup(function(e) {
            if( e.which == 13 ) {
                params.set( 'css', $(this).val() );
                window.location.href = uri();
            }
        });
        
        // hide selector if it or link not clicked
        $(document).click(function(event) {
            var id = event.target.id;
            if ( $('#gist-selector').is(':visible') ) {
                if ( id === 'gist-url' || id === 'gist-selector' || id === 'gist-input' ) {
                } else {
                    $('#gist-selector').hide();
                }
            }
            if ( $('#css-selector').is(':visible') ) {
                if ( id === 'css-url' || id === 'css-selector' || id === 'css-input' ) {
                } else {
                    $('#css-selector').hide();
                }
            }
        });
        
        // Gist and CSS selectors
        $('.selector-toggle').click(function() {
            var prefix = '#gist';
            var id = $(this).attr('id');
            if ( id === 'css-url' ) {
                prefix = '#css';
            }
            $(prefix + '-selector').toggle();
            // move focus to text input
            $(prefix + '-input').focus();

            // set position
            var p = $(this).position();
            $(prefix + '-selector').css({
                top: p.top + $(this).height() + 10,
                left: p.left - 50
            });
            
            // create click events for links
            $(prefix + '-selector span').click(function(event) {
                if ( prefix === '#gist' ){
                    params.set( 'gist', $(this).attr("id") );
                } else {
                    params.set( 'css', $(this).attr("id") );
                }
                window.location.href = uri();
            });
        });
        
        function uri() {
            var q = params.toString();
            if ( q.length > 0 ) q = '?' + q;
            return window.location.href.split('?')[0] + q + location.hash;
        }
    }

});
