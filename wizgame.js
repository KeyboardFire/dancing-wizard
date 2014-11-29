function game() {
    game.ART = loadArt();
    game.SPELLS = loadSpells();
    game.PADDING = 10;
    game.PPX = game.PADDING + 'px';
    game.CREATURES = $('<div>').appendTo(document.body);

    // create player <pre>s (for ASCII art) and gesture list views
    var mkp = function(p) {
        return $('<pre>').appendTo(game.CREATURES).css({
            position: 'absolute',
            bottom: game.PPX,
            left: (p == 1 ? game.PPX : undefined),
            right: (p == 2 ? game.PPX : undefined)
        }).text(game.ART['wiz' + p]).data({
            spells: [],
            health: 20,
            maxHealth: 20,
            resist: {Heat: 0, Cold: 0}
        });
    }, mkg = function(p) {
        return $('<div>').addClass('gestures').appendTo(document.body).css({
            position: 'absolute',
            top: game.PPX,
            left: (p == 1 ? game.PPX : undefined),
            right: (p == 2 ? game.PPX : undefined)
        });
    };
    game.$P1 = mkp(1);
    game.$P2 = mkp(2);
    var $p1gestures = mkg(1),
        $p2gestures = mkg(2),
        p1actions = [],
        p2actions = [];

    var go = function() {
        update();

        getActions(function(p1a, p2a) {
            p1actions.push(p1a);
            p2actions.push(p2a);
            $p1gestures.append($('<div>').text(p1a.join(' ')));
            $p2gestures.append($('<div>').text(p2a.join(' ')));

            getSpells(p1actions, p2actions, function(p1spell, p1target, p2spell, p2target) {
                castSpell(1, p1spell, p1target, function() {
                    castSpell(2, p2spell, p2target, function() {

                        applySpells(p1target);
                        applySpells(p2target);
                        go();

                    });
                });
            });
        });
    };
    go();
}

function update() {
    // TODO time out resistances
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
    askSpell(1, p1spells, function(p1choice, p1target) {
        askSpell(2, p2spells, function(p2choice, p2target) {
            callback(p1choice, p1target, p2choice, p2target);
        });
    });
}

function askSpell(p, spells, callback) {
    if (!spells.length) {
        callback(undefined, undefined);
        return;
    }

    var spellNames = [];
    for (var i = 0; i < spells.length; ++i) spellNames.push(spells[i].name);

    var i = 1;
    msg('Player ' + p + ', please choose a spell to cast<br>1. ' +
        spellNames.join('<br>*. ').replace(/\*/g, function() { return ++i; }));
    $(window).on('keydown', function(e) {
        var n = e.which - 49;
        if (spells[n]) {
            flash();
            msg('Please choose a target for your spell');
            game.CREATURES.children().each(function(i) {
                var $this = $(this);
                $(document.body).append($('<div>').text(i+1).css({
                    position: 'absolute',
                    top: $this.offset().top,
                    left: $this.offset().left
                }).addClass('numberThingy'));
            });
            $(window).off('keydown').on('keydown', function(e) {
                var targetN = e.which - 49;
                flash();
                $(window).off('keydown');
                $('.numberThingy').remove();
                callback(spells[n], game.CREATURES.children().eq(targetN));
            });
        }
    });
}

function castSpell(p, spell, target, callback) {
    if (spell === undefined) {
        callback();
        return;
    }

    var $p = game['$P' + p];
    $p.text(game.ART['wiz' + p + 'pew']);
    $('<pre>').text(game.ART.pew).css({
        position: 'absolute',
        top: $p.offset().top,
        left: (p == 1) ? ($p.offset().left + $p.width()) : ($p.offset().left)
    }).appendTo(document.body)
        .animate({top: game.PADDING}, {duration: 2000})
        .delay(0)
        .animate({
            top: target.offset().top + target.width() / 2,
            left: target.offset().left + target.height() / 2
        }, {
            complete: function() {
                $(this).remove();
                game['$P' + p].text(game.ART['wiz' + p]);
            },
            duration: 2000
        });

    // remove Target[...] (because now it's always Self)
    var notation = spell.notation.split(' ').slice(1);

    // Create[] switches context; take that into account
    // also add a property for which spell this was and which level, in case of Cancel[]
    var inSwitchedContext = false;
    for (var i = 0; i < notation.length; ++i) {
        if (notation[i].slice(0, 6) == 'Create') {
            inSwitchedContext = true;
        } else if (inSwitchedContext) {
            notation[i] = '!' + notation[i];
        }

        // I am a terrible person. Sorry.
        notation[i] = new String(notation[i]);
        notation[i].which = spell.shortname;
        notation[i].pow = spell.level;
    }

    if (!target.data('spells')) target.data('spells', []);
    target.data('spells', target.data('spells').concat(notation));
    callback();
}

function applySpells(target) {
    if (target === undefined) return;

    var spells = {};
    for (var i = 0; i < target.data('spells').length; ++i) {
        var spell = target.data('spells')[i],
            spellSplit = spell.split('[');
        var spellType = spellSplit[0],
            spellData = new String(spellSplit[1].slice(0, -1));

        // please forgive me
        spellData.which = spell.which;
        spellData.pow = spell.pow;

        if (!spells[spellType]) spells[spellType] = [];
        spells[spellType].push(spellData);
    }
    target.data('spells', []);

    if (spells.Resist) {
        // a resist overrides an un-resist
        var hasResisted = {Cold: false, Heat: false};

        for (var i = 0; i < spells.Resist.length; ++i) {
            var args = spells.Resist[i].split(',');
            var type = args[0],
                enable = (args[1] ? Boolean(args[1]) : true),
                len = +(args[2] || '*') || Infinity;

            if (hasResisted[type] && (!enable)) continue;
            if (enable) hasResisted[type] = true;

            var res = target.data('resist');
            res[type] = enable ? len : 0;
            target.data('resist', res);
        }
    }

    if (spells.Cancel) {
        for (var i = 0; i < spells.Cancel.length; ++i) {
            var args = spells.Cancel[i].split(',');

            if (args[0].length === 1) {
                var type = args[0],
                    pow = +(args[1] || 5);

                if (spells.Damage) for (var si = 0; si < spells.Damage.length; ++si) {
                    if ((type == '*' || spells.Damage[si].split(',')[1] == type)
                        && (spells.Damage[si].pow <= pow)) {
                        spells.Damage.splice(si--, 1);
                        continue;
                    }
                }
            } else {
                if (spells.Damage) for (var si = 0; si < spells.Damage.length; ++si) {
                    if (args.indexOf(spells.Damage[si].which) !== -1) {
                        spells.Damage.splice(si--, 1);
                        continue;
                    }
                }
            }
        }
    }

    if (spells.Damage) {
        for (var i = 0; i < spells.Damage.length; ++i) {
            var amt = +(spells.Damage[i].split(',')[0]);
            target.data('health', target.data('health') - amt);
        }
    }

    if (spells.Heal) {
        for (var i = 0; i < spells.Heal.length; ++i) {
            var amt = +(spells.Heal[i]);
            target.data('health', Math.min(target.data('health') + amt, target.data('maxHealth')));
        }
    }

    console.log('applySpells', target, spells);
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
