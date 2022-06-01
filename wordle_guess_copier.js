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

const wordleButtonStyle = 'top: 50px;left: 50%;background-color: var(--color-correct);color: var(--key-evaluated-text-color);font-family: inherit;font-weight: bold;border-radius: 4px;cursor: pointer;border: none;user-select: none;display: flex;justify-content: center;align-items: center;text-transform: uppercase;width: 80%;font-size: 20px;height: 52px;-webkit-filter: brightness(100%);';
const quordleButtonStyle = 'color: rgb(255 255 255 / var(--tw-text-opacity)); background-color:rgb(37,99,235); font-weight:500; padding:.75rem; border-radius:.5rem; border-color:white;';
const dordleButtonStyle = 'top: 50px;left: 50%;background-color: white;color: black;font-family: inherit;font-weight: bold;border-radius: 4px;cursor: pointer;border: none;user-select: none;display: flex;justify-content: center;align-items: center;text-transform: uppercase;width: 80%;font-size: 20px;height: 52px;-webkit-filter: brightness(100%);';
const dungleonButtonStyle = 'margin-top:7px;';
let slackEmojis = [{word:"smile",code:":smile:"},{word:"blush",code:":blush:"},{word:"smirk",code:":smirk:"},{word:"sweat",code:":sweat:"},{word:"weary",code:":weary:"},{word:"angry",code:":angry:"},{word:"alien",code:":alien:"},
                     {word:"heart",code:":heart:"},{word:"cupid",code:":cupid:"},{word:"dizzy",code:":dizzy:"},{word:"anger",code:":anger:"},{word:"notes",code:":notes:"},{word:"punch",code:":punch:"},{word:"metal",code:":metal:"},
                     {word:"woman",code:":woman:"},{word:"angel",code:":angel:"},{word:"skull",code:":skull:"},{word:"sunny",code:":sunny:"},{word:"cloud",code:":cloud:"},{word:"foggy",code:":foggy:"},{word:"ocean",code:":ocean:"},
                     {word:"mouse",code:":mouse:"},{word:"tiger",code:":tiger:"},{word:"koala",code:":koala:"},{word:"horse",code:":horse:"},{word:"camel",code:":camel:"},{word:"sheep",code:":sheep:"},{word:"snake",code:":snake:"},
                     {word:"snail",code:":snail:"},{word:"whale",code:":whale:"},{word:"tulip",code:":tulip:"},{word:"shell",code:":shell:"},{word:"dolls",code:":dolls:"},{word:"flags",code:":flags:"},{word:"ghost",code:":ghost:"},
                     {word:"santa",code:":santa:"},{word:"phone",code:":phone:"},{word:"pager",code:":pager:"},{word:"sound",code:":sound:"},{word:"watch",code:":watch:"},{word:"radio",code:":radio:"},{word:"email",code:":email:"},
                     {word:"pound",code:":pound:"},{word:"hocho",code:":hocho:"},{word:"books",code:":books:"},{word:"clubs",code:":clubs:"},{word:"shirt",code:":shirt:"},{word:"dress",code:":dress:"},{word:"libra",code:":libra:"},
                     {word:"jeans",code:":jeans:"},{word:"crown",code:":crown:"},{word:"pouch",code:":pouch:"},{word:"purse",code:":purse:"},{word:"beers",code:":beers:"},{word:"pizza",code:":pizza:"},{word:"fries",code:":fries:"},
                     {word:"curry",code:":curry:"},{word:"bento",code:":bento:"},{word:"sushi",code:":sushi:"},{word:"ramen",code:":ramen:"},{word:"dango",code:":dango:"},{word:"bread",code:":bread:"},{word:"candy",code:":candy:"},
                     {word:"apple",code:":apple:"},{word:"lemon",code:":lemon:"},{word:"peach",code:":peach:"},{word:"melon",code:":melon:"},{word:"house",code:":house:"},{word:"hotel",code:":hotel:"},{word:"japan",code:":japan:"},
                     {word:"stars",code:":stars:"},{word:"three",code:":three:"},{word:"seven",code:":seven:"},{word:"eight",code:":eight:"},{word:"metro",code:":metro:"},{word:"chart",code:":chart:"},{word:"aries",code:":aries:"},
                     {word:"virgo",code:":virgo:"},{word:"train",code:":train:"},{word:'neigh',code:':horse:'},{word:'plebs',code:'man-woman-girl-boy'}];

function getSlackEmoji(word) {
    let slackWords = _.pluck(slackEmojis, 'word');
    let matchIndex = _.indexOf(slackWords, word);

    if (matchIndex >= 0) {
        return ' ' + slackEmojis[matchIndex].code;
    } else {
        return '';
    }
}

function formatSlackLetters(letters) {
    let emoji = getSlackEmoji(letters.toLowerCase());

    return '`' + letters.toUpperCase() + '` ' + emoji;
}

let extractWordleGuesses = function (event) {
    // Rows are within a shadow DOM node on the game-app node
    // Need to manually traverse DOM within the shadow-root node
    const gameApp = $('game-app')[0];
    const gameRows = $('game-row', gameApp.shadowRoot);

    let clipboardText = '';

    let rowCount = 0;

    gameRows.each(function(index, element) {
        let letters = element.getAttribute('letters');
        if (letters == '') {
            rowCount = index;
            return false;
        }

        let rowData = extractWordleRow(element.shadowRoot);
        clipboardText += rowData.rowText + ' ' + formatSlackLetters(letters) + '\x0D';

        if (rowData.isSolution) {
            rowCount = index + 1;
            return false;
        }

    });

    clipboardText = 'Wordle ' + getSlackNumber(rowCount, 6) + '/6* \x0D' + clipboardText;

    copyRichText(clipboardText);

    event.stopImmediatePropagation();
}

function extractWordleRow(row) {
    let result = {rowText: '', letters: '', isSolution: true};

    $('game-tile', row).each(function(index, element) {
        let letter = element.getAttribute('letter').toUpperCase();
        let evaluation = element.getAttribute('evaluation');

        result.letters += letter;

        if (evaluation == 'correct') {
            result.rowText += ':large-green-square:';
        } else {
            result.isSolution = false;
            if (evaluation == 'present') {
                result.rowText += ':large-yellow-square:';
            } else {
                result.rowText += ':black-large-square:';
            }
        }
    });

    return result;
}


let appendWordleCopyButton = function() {
    const copyTag = createCopyTag(extractWordleGuesses, wordleButtonStyle);

    const gameApp = $('game-app')[0];
    const gameModal = $('game-modal', gameApp.shadowRoot)[0];
    const modalContent = $('div.content', gameModal.shadowRoot)[0];
    modalContent.prepend(copyTag);
}


// ***********************************************************************************
// ***********************************************************************************


function copyQuordleBoardRow(gameBoardLeft, gameBoardRight) {
    let rowText = '';
    let leftCount = 10;
    let rightCount = 10;

    let leftRows = $('[role="row"]', gameBoardLeft);
    let rightRows = $('[role="row"]', gameBoardRight);

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
    });

    return {rowText: rowText, leftCount: leftCount, rightCount: rightCount};
}

function getQuordleRowColors(row) {
    let cells = $('[role="cell"]',row);
    let colorText = '';
    let blank = true;
    let isComplete = true;

    cells.each(function(index, cell) {
        const ariaLabel = cell.getAttribute('aria-label');
        if (ariaLabel.includes('Blank')) {
            colorText += ':black-small-square:';
            isComplete = false;
        } else {
            blank = false;
            if (ariaLabel.includes('incorrect')) {
                colorText += ':black-large-square:';
                isComplete = false;
            } else if (ariaLabel.includes('correct')) {
                colorText += ':large-green-square:';
            } else {
                colorText += ':large-yellow-square:';
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

    copyRichText(clipboardText);
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

let appendQuordleCopyButton = function() {
    let app = $('[aria-label="Game results and share banner"]');
    if (app.length < 1) {
        quordleObserver.observe(document.body, {attributes: true, childList: true, characterData: true});
        app = $('#root');
    }
    const copyTag = createCopyTag(copyQuordleGuesses, quordleButtonStyle);
    app.prepend(copyTag);
}

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
            rowData.rowColors += ':large-yellow-square:';
            rowData.isBlank = false;
            rowData.isSolved = false;
        } else if (backgroundColor.includes('rgb(0, 0, 0)')) {
            rowData.rowColors += ':black-large-square:';
            rowData.isSolved = false;
        } else if (backgroundColor.includes('rgb(0, 170, 102)')) {
            rowData.rowColors += ':large-green-square:';
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
            leftRow.rowColors = ':black-small-square:'.repeat(5);
        }
        if (row > rightSolutionCount) {
            rightRow.rowColors = ':black-small-square:'.repeat(5);
        }

        copyText += `${leftRow.rowColors} ${rightRow.rowColors} ${formatSlackLetters(letters)} \x0D`;
    }

    const gameTitle = $('#game_title').text();
    copyText = `${gameTitle} ${getSlackNumber(leftSolutionCount, 7)}${getSlackNumber(rightSolutionCount, 7)} \x0D` + copyText;

    copyRichText(copyText);

    return;
}

let appendDordleCopyButton = function() {
    let app = $('#body');
    const copyTag = createCopyTag(copyDordleGuesses, dordleButtonStyle);
    app.append(copyTag);
}

let updateDataAndCopy = function(copyButtonFn, event) {
    downloadEmoji(function(data) {
        slackEmojis = data;
        copyButtonFn(event);
    }, function() {
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

    console.debug(nameLabel);
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
            rowColors += ':large_purple_square:';
        } else if (cell.hasClass('correct')) {
            rowColors += ':large_green_square:';
        } else {
            rowColors += ':large_yellow_square:';
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

    $('#grid .row').each(function(rowIndex) {
        let row = getDungleonRow($(this), rowIndex);

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
        difficultyCrystal = ' :small_orange_diamond:';
    }

    const puzzleNumber = $('#puzzle-number').text();

    output = `Dungleon ${puzzleNumber} ${getSlackNumber(solveCount, 6)}/6${difficultyCrystal} \x0D` + output;

    const heroCount = $('#heroes-counter').text();
    const monstersCount = $('#monsters-counter').text();
    const goldCount = $('#gold-counter').text();
    const streak = $('.value.victory').text();
    output += `${heroCount}:crossed_swords: ${monstersCount}:japanese_ogre: ${goldCount}:coin: \x0D`;
    output += `Streak: ${streak}`;

    copyRichText(output);

    return;
}

let appendDungleonCopyButton = function() {
    let app = $('#results');
    let copyTag = createCopyTag(copyDungleonGuesses, dungleonButtonStyle);
    copyTag.className = 'share button victory';

    app.append(copyTag);
}


// ***********************************************************************************
// ***********************************************************************************


function createCopyTag(clickEventHandler, buttonStyle) {
    let tag = document.createElement("button");
    tag.addEventListener('click', function(event){updateDataAndCopy(clickEventHandler, event)});
    tag.setAttribute('style',buttonStyle);

    let text = document.createTextNode("Copy them guesses!");

    tag.appendChild(text);

    return tag;
}

function getSlackNumber(numeral, max) {
    if (numeral > max) {
        return ':large_red_square:';
    }

    switch (numeral) {
        case 1:
            return ':one:';
        case 2:
            return ':two:';
        case 3:
            return ':three:';
        case 4:
            return ':four:';
        case 5:
            return ':five:';
        case 6:
            return ':six:';
        case 7:
            return ':seven:';
        case 8:
            return ':eight:';
        case 9:
            return ':nine:';
    }

    return ':large_red_square:';
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

function detectGame() {
    if (document.URL.includes('wordle')) {
        return {game: 'wordle', appendCopyButton: appendWordleCopyButton};
    } else if (document.URL.includes('quordle')) {
        return {game: 'quordle', appendCopyButton: appendQuordleCopyButton};
    } else if (document.URL.includes('hwcdn')) {
        return {game: 'dordle', appendCopyButton: appendDordleCopyButton};
    } else if (document.URL.includes('dungleon')) {
        return {game: 'dungleon', appendCopyButton: appendDungleonCopyButton};
    } else {
        console.debug('Unknown game');
        return {game: 'unknown', appendCopyButton: function() {return;}};
    }
}

const gameSettings = detectGame();

console.debug('User Script detected ', gameSettings.game);

gameSettings.appendCopyButton();

// Fetch valid slack emojis and replace the pre-defined list
function downloadEmoji(success, failure) {
    $.ajax({
        'async': true,
        'global': false,
        'url': 'https://raw.githubusercontent.com/emoryau/slackemoji/main/emoji.json',
        'dataType': 'json',
        'success': success,
        'error': failure
    });
}
