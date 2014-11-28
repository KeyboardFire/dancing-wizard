function game() {
    game.ART = loadArt();
    game.SPELLS = loadSpells();
    game.PADDING = 10;
    game.PPX = game.PADDING + 'px';

    // create player <pre>s (for ASCII art) and gesture list views
    var mkp = function(p) {
        return $('<pre>').appendTo(document.body).css({
            position: 'absolute',
            bottom: game.PPX,
            left: (p == 1 ? game.PPX : undefined),
            right: (p == 2 ? game.PPX : undefined)
        }).text(game.ART['wiz' + p]);
    }, mkg = function(p) {
        return $('<div>').addClass('gestures').appendTo(document.body).css({
            position: 'absolute',
            top: game.PPX,
            left: (p == 1 ? game.PPX : undefined),
            right: (p == 2 ? game.PPX : undefined)
        });
    };
    var p1 = mkp(1),
        p2 = mkp(2),
        p1g = mkg(1),
        p2g = mkg(2),
        p1as = [],
        p2as = [];

    var go = function() {
        getActions(function(p1a, p2a) {
            p1as.push(p1a);
            p2as.push(p2a);
            p1g.append($('<div>').text(p1a.join(' ')));
            p2g.append($('<div>').text(p2a.join(' ')));

            getSpells(p1as, p2as, function(p1s, p2s) {
                console.log(p1s, p2s);
                go();
            });
        });
    };
    go();
}

function getActions(callback) {
    var actions = [];
    var spellList = $('table');

    msg('Player 1, please input your actions');
    $(window).on('keydown', function(e) {
        if (e.which == 38) {
            // up arrow key
            spellList.css('top', (+spellList.css('top').slice(0, -2) - 50) + 'px');
        } else if (e.which == 40) {
            // down arrow key
            spellList.css('top', (+spellList.css('top').slice(0, -2) + 50) + 'px');
        } else if (e.which == 32) {
            // space
            spellList.toggle('slow');
        } else if ('PFSWOCHK'.indexOf(String.fromCharCode(e.which)) !== -1) {
            actions.push(String.fromCharCode(e.which));
            flash();
            if (actions.length == 2) msg('Player 2, please input your actions');
            else if (actions.length == 4) {
                $(window).off('keydown');
                spellList.hide();
                callback(actions.slice(0, 2), actions.slice(2, 4));
            }
        }
    });
}

function getSpells(p1as, p2as, callback) {
    var p1s = listSpells(p1as), p2s = listSpells(p2as);
    var p1c, p2c;

    // argh this is ugly
    if (p1s.length) {
        var i = 1;
        msg('Player 1, please choose a spell to cast<br>1. ' +
            p1s.join('<br>*. ').replace(/\*/g, function() { return ++i; }));
        $(window).on('keydown', function(e) {
            var n = e.which - 49;
            if (p1s[n]) {
                p1c = p1s[n];
                flash();
                $(window).off('keydown');
                if (p2s.length) {
                    var i = 1;
                    msg('Player 2, please choose a spell to cast<br>1. ' +
                        p2s.join('<br>*. ').replace(/\*/g, function() { return ++i; }));
                    $(window).on('keydown', function(e) {
                        var n = e.which - 49;
                        if (p2s[n]) {
                            p2c = p2s[n];
                            flash();
                            $(window).off('keydown');
                            callback(p1c, p2c);
                        }
                    });
                } else callback(p1c, undefined);
            }
        });
    } else if (p2s.length) {
        var i = 1;
        msg('Player 2, please choose a spell to cast<br>1. ' +
            p2s.join('<br>*. ').replace(/\*/g, function() { return ++i; }));
        $(window).on('keydown', function(e) {
            var n = e.which - 49;
            if (p2s[n]) {
                p2c = p2s[n];
                flash();
                $(window).off('keydown');
                callback(undefined, p2c);
            }
        });
    } else callback(undefined, undefined);
}

function listSpells(actions) {
    var spells = [];
    for (var i = 0; i < game.SPELLS.length; ++i) {
        var sg = game.SPELLS[i].gestures.match(/\w\/\w|\w/g),
            g = actions.slice(-sg.length);

        // verify length
        if (g.length !== sg.length) continue;

        // try both left and right as "primary" hand (uppercase)
        handsLoop:
        for (var primary = 0; primary < 2; ++primary) {
            for (var gi = 0; gi < g.length; ++gi) {
                if (sg[gi].indexOf('/') !== -1) {
                    // both hands
                    var spl = sg[gi].split('/');
                    if ((spl[0] !== g[gi][primary]) ||
                        (spl[1].toUpperCase() !== g[gi][+!primary])) {
                        // fail
                        continue handsLoop;
                    }
                } else if (sg[gi].toLowerCase() === sg[gi]) {
                    // secondary hand
                    if (sg[gi].toUpperCase() !== g[gi][+!primary]) {
                        continue handsLoop;
                    }
                } else {
                    // primary hand
                    if (sg[gi] !== g[gi][primary]) {
                        continue handsLoop;
                    }
                }
            }
            // yay!
            spells.push(game.SPELLS[i].name);
            break;
        }
    }
    return spells;
}

function msg(txt) {
    if (msg.el) msg.el.remove();
    msg.el = $('<div>').html(txt).css({
        position: 'absolute',
        top: game.PPX,
        width: '100%',
        textAlign: 'center',
        fontSize: '1px'
    }).appendTo(document.body)
        .animate({fontSize: 50});
}

function flash() {
    $('<div>').css({
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#0F0',
        opacity: '0'
    }).appendTo(document.body)
        .animate({opacity: 1}, {duration: 50})
        .delay(50)
        .animate({opacity: 0}, {duration: 50, complete: function() {
                $(this).remove();
            }});
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

function loadSpells() {
    var spells;
    $.ajax({url: 'spells.json', success: function(data) {
        spells = data;
    }, async: false});
    return spells;
}

$(game);
