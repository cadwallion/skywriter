/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the 'License'); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the 'GPL'), or
 * the GNU Lesser General Public License Version 2.1 or later (the 'LGPL'),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Range = require('rangeutils:utils/range');

// TODO: These should not be using private APIs of the view.

//
// Simple movement.
//
// These simply delegate to the text view, because they take the text view's
// private virtual selection into account.
//

exports.moveDown = function(env, args, request) {
    var view = env.get('view');
    view.moveDown();
};

exports.moveLeft = function(env, args, request) {
    var view = env.get('view');
    view.moveLeft();
};

exports.moveRight = function(env, args, request) {
    var view = env.get('view');
    view.moveRight();
};

exports.moveUp = function(env, args, request) {
    var view = env.get('view');
    view.moveUp();
};

//
// Simple selection.
//

exports.selectDown = function(env, args, request) {
    var view = env.get('view');
    view.selectDown();
};

exports.selectLeft = function(env, args, request) {
    var view = env.get('view');
    view.selectLeft();
};

exports.selectRight = function(env, args, request) {
    var view = env.get('view');
    view.selectRight();
};

exports.selectUp = function(env, args, request) {
    var view = env.get('view');
    view.selectUp();
};

//
// Move or select to the end of the line or document.
//

var moveOrSelectEnd = function(env, shift, inLine) {
    var view = env.get('view'), model = env.get('model');
    var lines = model.get('lines');
    var selectedRange = view.getSelectedRange();
    var row = inLine ? selectedRange.end.row : lines.length - 1;
    view.moveCursorTo({ row: row, column: lines[row].length }, shift);
};

exports.moveLineEnd = function(env, args, request) {
    moveOrSelectEnd(env, false, true);
};

exports.selectLineEnd = function(env, args, request) {
    moveOrSelectEnd(env, true, true);
};

exports.moveDocEnd = function(env, args, request) {
    moveOrSelectEnd(env, false, false);
};

exports.selectDocEnd = function(env, args, request) {
    moveOrSelectEnd(env, true, false);
};

//
// Move or select to the beginning of the line or document.
//

var moveOrSelectStart = function(env, shift, inLine) {
    var view = env.get('view');
    var range = view.getSelectedRange();
    var row = inLine ? range.end.row : 0;
    var position = { row: row, column: 0 };
    view.moveCursorTo(position, shift);
};

exports.moveLineStart = function (env, args, request) {
    moveOrSelectStart(env, false, true);
};

exports.selectLineStart = function(env, args, request) {
    moveOrSelectStart(env, true, true);
};

exports.moveDocStart = function(env, args, request) {
    moveOrSelectStart(env, false, false);
};

exports.selectDocStart = function(env, args, request) {
    moveOrSelectStart(env, true, false);
};

//
// Move or select to the next or previous word.
//

var seekNextStop = function(view, text, column, dir, rowChanged) {
    var isDelim;
    var countDelim = 0;
    var wasOverNonDelim = false;

    if (dir < 0) {
        column--;
        if (rowChanged) {
            countDelim = 1;
        }
    }

    while (column < text.length && column > -1) {
        isDelim = view.isDelimiter(text[column]);
        if (isDelim) {
            countDelim++;
        } else {
            wasOverNonDelim = true;
        }
        if ((isDelim || countDelim > 1) && wasOverNonDelim) {
            break;
        }
        column += dir;
    }

    if (dir < 0) {
        column++;
    }

    return column;
};

var moveOrSelectNextWord = function(env, shiftDown) {
    var view = env.get('view'), model = env.get('model');
    var lines = model.get('lines');

    var selectedRange = view.getSelectedRange(true);
    var end = selectedRange.end;
    var row = end.row, column = end.column;

    var currentLine = lines[row];
    var changedRow = false;

    if (column >= currentLine.length) {
        row++;
        changedRow = true;
        if (row < lines.length) {
            column = 0;
            currentLine = lines[row];
        } else {
            currentLine = '';
        }
    }

    column = seekNextStop(view, currentLine, column, 1, changedRow);

    view.moveCursorTo({ row: row, column: column }, shiftDown);
};

var moveOrSelectPreviousWord = function(env, shiftDown) {
    var view = env.get('view'), model = env.get('model');

    var lines = model.get('lines');
    var selectedRange = view.getSelectedRange(true);
    var end = selectedRange.end;
    var row = end.row, column = end.column;

    var currentLine = lines[row];
    var changedRow = false;

    if (column > currentLine.length) {
        column = currentLine.length;
    } else if (column == 0) {
        row--;
        changedRow = true;
        if (row > -1) {
            currentLine = lines[row];
            column = currentLine.length;
        } else {
            currentLine = '';
        }
    }

    column = seekNextStop(view, currentLine, column, -1, changedRow);

    view.moveCursorTo({ row: row, column: column }, shiftDown);
};

exports.moveNextWord = function(env, args, request) {
    moveOrSelectNextWord(env, false);
};

exports.selectNextWord = function(env, args, request) {
    moveOrSelectNextWord(env, true);
};

exports.movePreviousWord = function(env, args, request) {
    moveOrSelectPreviousWord(env, false);
};

exports.selectPreviousWord = function(env, args, request) {
    moveOrSelectPreviousWord(env, true);
};

//
// Miscellaneous.
//

/**
 * Selects all characters in the buffer.
 */
exports.selectAll = function(env, args, request) {
    var view = env.get('view');
    view.selectAll();
};
