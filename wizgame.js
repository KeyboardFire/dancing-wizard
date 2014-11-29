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
    var $p1 = mkp(1),
        $p2 = mkp(2),
        $p1gestures = mkg(1),
        $p2gestures = mkg(2),
        p1actions = [],
        p2actions = [];

    var go = function() {
        getActions(function(p1a, p2a) {
            p1actions.push(p1a);
            p2actions.push(p2a);
            $p1gestures.append($('<div>').text(p1a.join(' ')));
            $p2gestures.append($('<div>').text(p2a.join(' ')));

            getSpells(p1actions, p2actions, function(p1spell, p2spell) {
                // okay, now actually cast the spells
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
            spellList.css('top', (+spellList.css('top').slice(0, -2) + 50) + 'px');
        } else if (e.which == 40) {
            // down arrow key
            spellList.css('top', (+spellList.css('top').slice(0, -2) - 50) + 'px');
        } else if (e.which == 37) {
            // left arrow key
            spellList.css('font-size', (+spellList.css('font-size').slice(0, -2) - 1) + 'px');
        } else if (e.which == 39) {
            // right arrow key
            spellList.css('font-size', (+spellList.css('font-size').slice(0, -2) + 1) + 'px');
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

function getSpells(p1actions, p2actions, callback) {
    var p1spells = listSpells(p1actions), p2spells = listSpells(p2actions);
    var p1spellnames = p1spells.slice(), p2spellnames = p2spells.slice();
    for (var i = 0; i < p1spellnames.length; ++i) p1spellnames[i] = p1spellnames[i].name;
    for (var i = 0; i < p2spellnames.length; ++i) p2spellnames[i] = p2spellnames[i].name;
    var p1choice, p2choice;

    // argh this is ugly
    if (p1spells.length) {
        askSpell(1, p1spells, function(p1choice) {
            if (p2spells.length) {
                askSpell(2, p2spells, function(p2choice) {
                    callback(p1choice, p2choice);
                });
            } else callback(p1choice, undefined);
        });
    } else if (p2spells.length) {
        askSpell(2, p2spells, function(p2choice) {
            callback(undefined, p2choice);
        });
    } else callback(undefined, undefined);
}

function askSpell(p, spells, callback) {
    var spellNames = [];
    for (var i = 0; i < spells.length; ++i) spellNames.push(spells[i].name);

    var i = 1;
    msg('Player ' + p + ', please choose a spell to cast<br>1. ' +
        spellNames.join('<br>*. ').replace(/\*/g, function() { return ++i; }));
    $(window).on('keydown', function(e) {
        var n = e.which - 49;
        if (spells[n]) {
            flash();
            $(window).off('keydown');
            callback(spells[n]);
        }
    });
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
            spells.push(game.SPELLS[i]);
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
