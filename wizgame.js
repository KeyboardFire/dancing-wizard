function game() {
    game.ART = loadArt();
    game.PADDING = 10;
    game.PPX = game.PADDING + 'px';

    // create player <pre>s (for ASCII art)
    var mkp = function(p) {
        return $('<pre>').appendTo(document.body).css({
            position: 'absolute',
            bottom: game.PPX,
            left: (p == 1 ? game.PPX : undefined),
            right: (p == 2 ? game.PPX : undefined)
        }).text(game.ART['wiz' + p]);
    }
    var p1 = mkp(1)
        p2 = mkp(2);

    getActions(function(p1a, p2a) {
        console.log(p1a, p2a);
    });
}

function getActions(callback) {
    var actions = [];

    msg('Player 1, please input your actions');
    $(window).on('keydown', function(e) {
        actions.push(String.fromCharCode(e.which));
        if (actions.length == 2) msg('Player 2, please input your actions');
        else if (actions.length == 4) {
            $(window).off('keydown');
            callback(actions.slice(0, 2), actions.slice(2, 4));
        }
    });
}

function msg(txt) {
    $('<div>').text(txt).css({
        position: 'absolute',
        top: game.PPX,
        width: '100%',
        textAlign: 'center',
        fontSize: '1px'
    }).appendTo(document.body)
        .animate({fontSize: 50}).delay(1000)
        .animate({fontSize: 0}, {complete: function() { $(this).remove(); }});
}

function loadArt() {
    var art = {};
    $.ajax({url: 'art.txt', success: function(data) {
        var parts = data.split(/^#/m);
        for (var i = 0; i < parts.length; ++i) {
            artsplit = parts[i].split('\n');
            art[artsplit.shift()] = artsplit.join('\n').slice(0, -1);
        }
    }, async: false});
    return art;
}

$(game);
