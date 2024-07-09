// ==UserScript==
// @name         Wordle Guess Copier
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Make formatting answer grids for wordle-likes
// @author       You
// @match        https://www.nytimes.com/*
// @match        https://www.quordle.com/*
// @match        https://*.hwcdn.net/*
// @match        https://*.dungleon.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/underscore@1.13.3/underscore-umd-min.js
// ==/UserScript==

const wordleButtonStyle = 'top: 50px;left: 50%;background-color: var(--color-correct);color: var(--key-evaluated-text-color);font-family: inherit;font-weight: bold;border-radius: 4px;cursor: pointer;border: none;user-select: none;display: flex;justify-content: center;align-items: center;text-transform: uppercase;width: 80%;font-size: 20px;height: 52px;-webkit-filter: brightness(100%);margin:5px;';
const dordleButtonStyle = 'background-color: white;color: black;font-family: inherit;font-weight: bold;border-radius: 4px;cursor: pointer;border: none;user-select: none;justify-content: center;align-items: center;text-transform: uppercase;width: 40%;font-size: 20px;-webkit-filter: brightness(100%);margin:5px;';
const quordleButtonStyle = 'color: rgb(255 255 255 / var(--tw-text-opacity)); background-color:rgb(37,99,235); font-weight:500; padding:.75rem; border-radius:.5rem; border-color:white;';
const dungleonButtonStyle = 'margin-top:7px;';
const BLACK_SQUARE = '\u2B1B';
const GREEN_SQUARE = '\u{1F7E9}';
const YELLOW_SQUARE = '\u{1F7E8}';
const RED_SQUARE = '\u{1F7E5}';
const PURPLE_SQUARE = '\u{1F7EA}';
const BLACK_SMALL_SQUARE = '\u25AA\uFE0F';
const CROSSED_SWORDS = '\u2694\uFE0F';
const JAPANESE_OGRE = '\u{1F479}';
const COIN = '\u{1FA99}';

// Silence tampermonkey warnings
let $ = window.jQuery;
let _ = window._;

/**
 * Static set of emojis to use in case webservice does not return usable data
 */
let slackEmojis = [{word:"smile",code:":smile:"},{word:"blush",code:":blush:"},{word:"smirk",code:":smirk:"},{word:"sweat",code:":sweat:"},{word:"weary",code:":weary:"},{word:"angry",code:":angry:"},{word:"alien",code:":alien:"},{word:"heart",code:":heart:"},{word:"cupid",code:":cupid:"},{word:"dizzy",code:":dizzy:"},{word:"anger",code:":anger:"},{word:"notes",code:":notes:"},{word:"punch",code:":punch:"},{word:"metal",code:":metal:"},{word:"woman",code:":woman:"},{word:"angel",code:":angel:"},{word:"skull",code:":skull:"},{word:"sunny",code:":sunny:"},{word:"cloud",code:":cloud:"},{word:"foggy",code:":foggy:"},{word:"ocean",code:":ocean:"},{word:"mouse",code:":mouse:"},{word:"tiger",code:":tiger:"},{word:"koala",code:":koala:"},{word:"horse",code:":horse:"},{word:"camel",code:":camel:"},{word:"sheep",code:":sheep:"},{word:"snake",code:":snake:"},{word:"snail",code:":snail:"},{word:"whale",code:":whale:"},{word:"tulip",code:":tulip:"},{word:"shell",code:":shell:"},{word:"dolls",code:":dolls:"},{word:"flags",code:":flags:"},{word:"ghost",code:":ghost:"},{word:"santa",code:":santa:"},{word:"phone",code:":phone:"},{word:"pager",code:":pager:"},{word:"sound",code:":sound:"},{word:"watch",code:":watch:"},{word:"radio",code:":radio:"},{word:"email",code:":email:"},{word:"pound",code:":pound:"},{word:"hocho",code:":hocho:"},{word:"books",code:":books:"},{word:"clubs",code:":clubs:"},{word:"shirt",code:":shirt:"},{word:"dress",code:":dress:"},{word:"libra",code:":libra:"},{word:"jeans",code:":jeans:"},{word:"crown",code:":crown:"},{word:"pouch",code:":pouch:"},{word:"purse",code:":purse:"},{word:"beers",code:":beers:"},{word:"pizza",code:":pizza:"},{word:"fries",code:":fries:"},{word:"curry",code:":curry:"},{word:"bento",code:":bento:"},{word:"sushi",code:":sushi:"},{word:"ramen",code:":ramen:"},{word:"dango",code:":dango:"},{word:"bread",code:":bread:"},{word:"candy",code:":candy:"},{word:"apple",code:":apple:"},{word:"lemon",code:":lemon:"},{word:"peach",code:":peach:"},{word:"melon",code:":melon:"},{word:"house",code:":house:"},{word:"hotel",code:":hotel:"},{word:"japan",code:":japan:"},{word:"stars",code:":stars:"},{word:"three",code:":three:"},{word:"seven",code:":seven:"},{word:"eight",code:":eight:"},{word:"metro",code:":metro:"},{word:"chart",code:":chart:"},{word:"aries",code:":aries:"},{word:"virgo",code:":virgo:"},{word:"train",code:":train:"},{word:'neigh',code:':horse:'},{word:'plebs',code:':man-woman-girl-boy:'}];



function detectGame() {
    if (document.URL.includes('wordle')) {
        return detectWordleVersion();
    } else if (document.URL.includes('quordle')) {
        return 'quordle.1';
    } else if (document.URL.includes('hwcdn')) {
        return 'dordle.1';
    } else if (document.URL.includes('dungleon')) {
        return 'dungleon.1'
    } else {
        return 'unknown.0';
    }
}


function getSlackEmoji(word) {
    let slackWords = _.pluck(slackEmojis, 'word');
    let matchIndex = _.indexOf(slackWords, word);

    if (matchIndex >= 0) {
        return ` ${slackEmojis[matchIndex].code}`;
    } else {
        return '';
    }
}

function formatSlackLetters(letters) {
    let emoji = getSlackEmoji(letters.toLowerCase());

    return `\`${letters.toUpperCase()}\`${emoji}`;
}

let extractWordleGuesses = function (event) {
    // Rows are within a shadow DOM node on the game-app node
    // Need to manually traverse DOM within the shadow-root node
    const gameApp = $('game-app')[0];
    const gameRows = $('game-row', gameApp.shadowRoot);

    let clipboardText = '';

    let rowCount = 0;

    let guessData = {rowData:[], clipboardText: ''};

    gameRows.each(function(index, element) {
        let letters = element.getAttribute('letters');
        if (letters == '') {
            rowCount = index;
            return false;
        }

        let rowData = extractWordleRow(element.shadowRoot);
        clipboardText += rowData.rowText + ' ' + formatSlackLetters(letters) + '\x0D';

        guessData.rowData.push(rowData);

        if (rowData.isSolution) {
            rowCount = index + 1;
            return false;
        }

    });

    guessData.clipboardText = 'Wordle ' + getSlackNumber(rowCount, 6) + '/6* \x0D' + clipboardText;

    return guessData;
}

function extractWordleRow(row) {
    let result = {rowText: '', letters: '', isSolution: true};

    $('game-tile', row).each(function(index, element) {
        let letter = element.getAttribute('letter').toUpperCase();
        let evaluation = element.getAttribute('evaluation');

        result.letters += letter;

        if (evaluation == 'correct') {
            result.rowText += GREEN_SQUARE;
        } else {
            result.isSolution = false;
            if (evaluation == 'present') {
                result.rowText += YELLOW_SQUARE;
            } else {
                result.rowText += BLACK_SQUARE;
            }
        }
    });

    return result;
}

function extractWordleRow_2(letterElements) {
    let result = {rowText: '', letters: '', isSolution: true};

    result.letters = letterElements.text();

    letterElements.each((index,element) => {
        let evaluation = element.getAttribute('data-state');

        if (evaluation == 'correct') {
            result.rowText += GREEN_SQUARE;
        } else {
            result.isSolution = false;
            if (evaluation == 'present') {
                result.rowText += YELLOW_SQUARE;
            } else {
                result.rowText += BLACK_SQUARE;
            }
        }
    });

    return result;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getWordleGameNumber() {
    try {
        return numberWithCommas(JSON.parse(window.localStorage.getItem('wordle-legacy-stats-ANON')).lastWonDayOffset);
    } catch {
        return '';
    }
}

let extractWordle2Guesses = function (event) {
    const gameRows = $('[class^="Row-module_row"]');

    let clipboardText = '';

    let rowCount = 0;

    let guessData = {rowData:[], clipboardText: ''};

    gameRows.each(function(index, element) {
        let letterElements = $('[class^="Tile-module_tile"]', element);

        let rowData = extractWordleRow_2(letterElements);

        if (rowData.letters === '') {
            // Empty guess, stop iterating before adding this empty row to the clipboard
            rowCount = index + 1;
            return false;
        }

        clipboardText += rowData.rowText + ' ' + formatSlackLetters(rowData.letters) + '\x0D';

        guessData.rowData.push(rowData);

        if (rowData.isSolution) {
            rowCount = index + 1;
            return false;
        }

    });

    guessData.clipboardText = 'Wordle ' + getWordleGameNumber() + ' ' + getSlackNumber(rowCount, 6) + '/6* \x0D' + clipboardText;

    return guessData;
}

function detectWordleVersion() {
    // There are now multiple versions of pages, test for which version we are using
    const originalVersion = $('game-app')[0];
    if (originalVersion) {
        return 'wordle.1';
    }
    const version2 = $('[class^="Row-module_row"]');
    if (version2.length > 0) {
        console.log('--- --- wordle2 --- ---');
        return 'wordle.2';
    }

    // No match, might need to wait for a splash screen to clear before we can detect & attach
    var target = document.querySelector('body')

    // Create an observer instance.
    var observer = new MutationObserver(function(mutations) {
        const version2 = $('[class^="Row-module_row"]');
        if (version2.length > 0) {
            console.log('--- --- wordle2 --- ---');

            const gameSettings = GAME_DESCRIPTORS['wordle.2'];

            console.debug('User Script detected ', gameSettings.game);

            addButtonsToDocument(gameSettings);

            // Done with observing, now that game has been detected and set up
            observer.disconnect();
        }
    });

    // Pass in the target node, as well as the observer options.
    observer.observe(target, {
        attributes:    true,
        childList:     true,
        characterData: true
    });

    // Return unknown to signal no game detected yet
    return 'unknown.0';
}


/**
 * Detect Wordle DOM version, pull current guess row data, and copy what we can to the clipboard
 *
 */
let copyJSON = function(event) {
    let version = detectGame();

    let guessData = GAME_DESCRIPTORS[version].extractGuessFn(event);

    let clipboardText = '';

    guessData.rowData.forEach((row) => {
        // If emoji is empty
        if (row.letters && getSlackEmoji(row.letters.toLowerCase()) === '') {
            clipboardText += JSON.stringify({'word': row.letters.toLowerCase(), 'code': ':shrug:'}) + ',\x0D';
        }
    });

    copyRichText(clipboardText);
}

let copyResults = function(event) {
    let version = detectGame();

    let guessData = GAME_DESCRIPTORS[version].extractGuessFn(event);

    let clipboardText = '';

    copyRichText(guessData.clipboardText);

    event.stopImmediatePropagation();
}

function addButtonsToDocument(gameDescriptor) {
    const copyTag = createButtonElement('Copy Results', copyResults, gameDescriptor.buttonStyle, gameDescriptor.className);
    const createGenerateJSONTag = createButtonElement('Missing Emoji', copyJSON, gameDescriptor.buttonStyle);

    let buttonContainer = gameDescriptor.getButtonContainerFn();

    if (buttonContainer) {
        buttonContainer.prepend(copyTag);

        if (createGenerateJSONTag) {
            buttonContainer.prepend(createGenerateJSONTag);
        }
    } else {
        console.log('--- ___ --- COULD NOT GET BUTTON CONTAINER --- ___ ---');
    }
}

// ***********************************************************************************
// ***********************************************************************************


function copyQuordleBoardRow(gameBoardLeft, gameBoardRight) {
    let rowText = '';
    let leftCount = 10;
    let rightCount = 10;

    let leftRows = $('[role="row"]', gameBoardLeft);
    let rightRows = $('[role="row"]', gameBoardRight);

    let rowLetters = [];

    leftRows.each(function(index, leftRow) {
        let letters = '';

        const rightRow = rightRows[index];

        let leftRowDetails = getQuordleRowColors(leftRow);
        let rightRowDetails = getQuordleRowColors(rightRow);

        if (leftRowDetails.isComplete) {
            leftCount = index + 1;
        }
        if (rightRowDetails.isComplete) {
            rightCount = index + 1;
        }

        // If both sides are blank, then do not insert the row
        if (leftRowDetails.isBlank && rightRowDetails.isBlank) {
            return false;
        }

        if (!leftRowDetails.isBlank && leftRowDetails.letters != '') {
            letters = leftRowDetails.letters;
        } else {
            letters = rightRowDetails.letters;
        }

        rowText += leftRowDetails.colorText + ' ' + rightRowDetails.colorText + ' ' + formatSlackLetters(letters) + '\x0D';

        rowLetters.push(letters);
    });

    return {rowText: rowText, leftCount: leftCount, rightCount: rightCount, rowLetters: rowLetters};
}

function getQuordleRowColors(row) {
    let cells = $('[role="cell"]',row);
    let colorText = '';
    let blank = true;
    let isComplete = true;

    cells.each(function(index, cell) {
        const ariaLabel = cell.getAttribute('aria-label');
        if (ariaLabel.includes('Blank')) {
            colorText += BLACK_SMALL_SQUARE;
            isComplete = false;
        } else {
            blank = false;
            if (ariaLabel.includes('incorrect')) {
                colorText += BLACK_SQUARE;
                isComplete = false;
            } else if (ariaLabel.includes('correct')) {
                colorText += GREEN_SQUARE;
            } else {
                colorText += YELLOW_SQUARE;
                isComplete = false;
            }
        }
    });

    return {colorText: colorText, isBlank: blank, isComplete: isComplete, letters: $('[role="cell"]',row).text()};
}

function getQuordleRowLetters(row) {
    let letters = $('[role="cell"]',row).text();
    return letters;
}

function copyQuordleGuesses() {
    const gameBoards = [$('[aria-label="Game Board 1"]'),$('[aria-label="Game Board 2"]'),$('[aria-label="Game Board 3"]'),$('[aria-label="Game Board 4"]')];
    let clipboardText = '';

    let topBoards = copyQuordleBoardRow(gameBoards[0], gameBoards[1]);
    let bottomBoards = copyQuordleBoardRow(gameBoards[2], gameBoards[3]);

    clipboardText += getSlackNumber(topBoards.leftCount) + ' ' + getSlackNumber(topBoards.rightCount) + ' \x0D';
    clipboardText += getSlackNumber(bottomBoards.leftCount) + ' ' + getSlackNumber(bottomBoards.rightCount) + ' \x0D';
    clipboardText += topBoards.rowText;
    clipboardText += '\x0D';
    clipboardText += bottomBoards.rowText;

    let guessData = {clipboardText: clipboardText, rowData: []};

    // Push the array of letters that is longer
    if (topBoards.rowLetters.length > bottomBoards.rowLetters.length) {
        topBoards.rowLetters.forEach(letters => guessData.rowData.push({letters: letters}));
    } else {
        bottomBoards.rowLetters.forEach(letters => guessData.rowData.push({letters: letters}));
    }

    return guessData;
}

// TODO: this isn't working yet, still not activating when the quordle is solved
let quordleObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            let hasAttribute = [].some.call(mutation.addedNodes, function(el) {
                return el.attr('aria-label') == 'Game results and share banner';
            });

            if (hasAttribute) {
                appendQuordleButton();
            }
        }
    });
});


// ***********************************************************************************
// ***********************************************************************************

function getDordleRow(side, rowNumber) {
    let rowColors = '';
    let isBlank = true;
    let rowData = {rowColors: '', isBlank: true, letters: '', isSolved: true};

    for (let col = 1; col <= 5; col++) {
        let cell = $(`#box${side}\\,${rowNumber}\\,${col}`);
        let backgroundColor = cell.css('background-color');

        rowData.letters += cell.text();

        if (cell.css('background-image') != 'none') {
            rowData.rowColors += YELLOW_SQUARE;
            rowData.isBlank = false;
            rowData.isSolved = false;
        } else if (backgroundColor.includes('rgb(0, 0, 0)')) {
            rowData.rowColors += BLACK_SQUARE;
            rowData.isSolved = false;
        } else if (backgroundColor.includes('rgb(0, 170, 102)')) {
            rowData.rowColors += GREEN_SQUARE;
            rowData.isBlank = false;
        }
    }

    return rowData;
}

let copyDordleGuesses = function() {
    let copyText = '';
    let letters = '';
    let leftSolutionCount = 8;
    let rightSolutionCount = 8;
    let guessData = {rowData:[], clipboardText: ''};

    for (let row = 1; row <= 7; row++) {
        // if both sides are already solved, stop iterating
        if (row > leftSolutionCount && row > rightSolutionCount) {
            break;
        }

        let leftRow = getDordleRow(1, row);
        let rightRow = getDordleRow(2, row);

        // Find letters
        if (leftRow.letters != '') {
            letters = leftRow.letters;
        } else if (rightRow.letters != '') {
            letters = rightRow.letters;
        } else {
            // No guess made for this row yet, stop iterating
            break;
        }

        // Test if either row is solved and record for
        if (leftRow.isSolved) {
            leftSolutionCount = row;
        }
        if (rightRow.isSolved) {
            rightSolutionCount = row;
        }

        // If the panel is already solved, then use small black squares to fill instead
        if (row > leftSolutionCount) {
            leftRow.rowColors = BLACK_SMALL_SQUARE.repeat(5);
        }
        if (row > rightSolutionCount) {
            rightRow.rowColors = BLACK_SMALL_SQUARE.repeat(5);
        }

        guessData.rowData.push({letters: letters});

        copyText += `${leftRow.rowColors} ${rightRow.rowColors} ${formatSlackLetters(letters)} \x0D`;
    }

    const gameTitle = $('#game_title').text();
    guessData.clipboardText = `${gameTitle} ${getSlackNumber(leftSolutionCount, 7)}/${getSlackNumber(rightSolutionCount, 7)} \x0D` + copyText;

    return guessData;
}


let updateDataThenExecute = function(copyButtonFn, event) {
    downloadEmoji(function(data) {
        slackEmojis = data;
        copyButtonFn(event);
    }, function(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
        alert('Failed to download slack emoji, using default list');
        copyButtonFn(event);
    });
}

function getDungleonCellSymbol(cell) {
    let nameLabel = $('.name-label', cell).text().toLowerCase();

    // Some symbol translations for the spells that don't map directly to slack
    if (nameLabel === 'the king') {
        nameLabel = 'king';
    } else if (nameLabel === 'axe orc') {
        nameLabel = 'axeorc';
    } else if (nameLabel === 'blade orc') {
        nameLabel = 'bladeorc';
    }

    if (nameLabel != '') {
        return `:dungleon-${nameLabel}:`;
    }

    return nameLabel;
}

function getDungleonRow(row, rowIndex) {
    let rowColors = '';
    let rowSymbols = '';
    let rowIsFilled = false;
    let rowIsCorrect = true;

    $('.cell', row).each(function(cellIndex) {
        let cell = $(this);
        if(cell.hasClass('wrong')) {
            rowColors += PURPLE_SQUARE;
        } else if (cell.hasClass('correct')) {
            rowColors += GREEN_SQUARE;
        } else {
            rowColors += YELLOW_SQUARE;
        }

        rowSymbols += getDungleonCellSymbol(cell);

        // Set filled if any before have been filled, or this cell is filled
        rowIsFilled = rowIsFilled || cell.hasClass('filled');
        // Set correct if all cells before have been correct, and this one is also correct
        rowIsCorrect = rowIsCorrect && cell.hasClass('correct');
    });

    let spellUsed = $('.spell-found', row).length > 0;

    return {rowColors: rowColors, rowSymbols: rowSymbols, rowIsFilled: rowIsFilled, rowIsCorrect: rowIsCorrect, spellUsed: spellUsed};
}

let copyDungleonGuesses = function() {
    let output = '';
    let solveCount = 7;
    let difficultyCrystal = ''
    let guessData = {rowData:[], clipboardText: ''};

    $('#grid .row').each(function(rowIndex) {
        let row = getDungleonRow($(this), rowIndex);

        guessData.rowData.push(row);

        if(!row.rowIsFilled) {
            // Row is not filled in, no need to iterate further, but leave solveCount at max to indicate unsolved puzzle
            return false;
        }

        let spellUsedSymbol = '';
        if (row.spellUsed) {
            spellUsedSymbol = ' :magic_wand:';
        }

        output += `${row.rowColors} ${row.rowSymbols}${spellUsedSymbol} \x0D`;
        if(row.rowIsCorrect) {
            solveCount = rowIndex + 1;
            return false;
        }
    });

    if($('#hard-mode-badge').length) {
        difficultyCrystal = ' \u{1F538}'; // :small_orange_diamond:
    }

    const puzzleNumber = $('#puzzle-number').text();

    output = `Dungleon ${puzzleNumber} ${getSlackNumber(solveCount, 6)}/6${difficultyCrystal} \x0D` + output;

    const heroCount = $('#heroes-counter').text();
    const monstersCount = $('#monsters-counter').text();
    const goldCount = $('#gold-counter').text();
    const streak = $('.value.victory').text();

    output += `${heroCount}${CROSSED_SWORDS} ${monstersCount}${JAPANESE_OGRE} ${goldCount}${COIN} \x0D`;
    output += `Streak: ${streak}`;

    guessData.clipboardText = output;

    return guessData;
}


// ***********************************************************************************
// ***********************************************************************************


function createButtonElement(label, clickEventHandler, buttonStyle, buttonClass) {
    let tag = document.createElement("button");
    tag.addEventListener('click', (event) => updateDataThenExecute(clickEventHandler, event));
    tag.setAttribute('style',buttonStyle);
    if (buttonClass) {
        tag.className = buttonClass;
    }

    let text = document.createTextNode(label);

    tag.appendChild(text);

    return tag;
}

function createMissingEmojiData(clickEventHandler, buttonStyle) {
    // Get the row data
}

function getSlackNumber(numeral, max) {
    if (numeral > max) {
        return RED_SQUARE;
    }

    return numeral;
    // Disabled the colored numbers for now, they're a bit annoying.

    // Slack numbers are qualified with two combining marks
    // 0xFE0F unknown, possibly color? Outside of standard Unicode range
    // 0x20E3 'combining enclosing keycap'
    const SLACK_QUALIFIERS = '\uFE0F\u20E3';

    if (numeral >= 1 && numeral <= 9) {
        return `${numeral}${SLACK_QUALIFIERS}`;
    } else {
        return RED_SQUARE;
    }
}

function copyRichText(text) {
    const listener = function(ev) {
        ev.preventDefault();
        ev.clipboardData.setData('text/plain', text);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);
}


/*
 * Fetch valid slack emojis and replace the pre-defined list
 */
function downloadEmoji(success, failure) {
    return $.ajax({
        'async': true,
        'global': false,
        'url': 'https://raw.githubusercontent.com/emoryau/slackemoji/main/emoji.json',
        'dataType': 'json',
        'cache': false,
        'success': success,
        'error': failure
    });
}

$(function() {
    const gameSettings = GAME_DESCRIPTORS[detectGame()];

    if (gameSettings === undefined) {
        console.debug('User Script did not detect game (yet)');
        return;
    }

    console.debug('User Script detected ', gameSettings.game);

    addButtonsToDocument(gameSettings);
});

const GAME_DESCRIPTORS = {
    'wordle.1': {
        game: 'Wordle',
        extractGuessFn: extractWordleGuesses,
        getButtonContainerFn: () => {
            const gameApp = $('game-app')[0];
            const gameModal = $('game-modal', gameApp.shadowRoot)[0];
            const modalContent = $('div.content', gameModal.shadowRoot)[0];

            return modalContent;
        },
        buttonStyle: wordleButtonStyle
    },
    'wordle.2': {
        game: 'Wordle',
        extractGuessFn: extractWordle2Guesses,
        getButtonContainerFn: () => {
            let container = $('[class^="AppHeader-module_appHeader"]')[0];

            if (container === undefined) {
                // button container not found, try another way
                container = $('[data-testid^="toolbar"]')[0];
            }

            return container;
        },
        buttonStyle: wordleButtonStyle
    },
    'dordle.1': {
        game: 'Dordle',
        extractGuessFn: copyDordleGuesses,
        getButtonContainerFn: () => $('#body'),
        buttonStyle: dordleButtonStyle
    },
    'quordle.1': {
        game: 'Quordle',
        extractGuessFn: copyQuordleGuesses,
        getButtonContainerFn: () => {
            let app = $('[aria-label="Game results and share banner"]');
            if (app.length < 1) {
                quordleObserver.observe(document.body, {attributes: true, childList: true, characterData: true});
                app = $('#root');
            }
            return app;
        },
        buttonStyle: quordleButtonStyle
    },
    'dungleon.1': {
        game: 'Dungleon',
        extractGuessFn: copyDungleonGuesses,
        getButtonContainerFn: function() {
            return $('#results');
        },
        buttonStyle: dungleonButtonStyle,
        className: 'share button'
    }
};
