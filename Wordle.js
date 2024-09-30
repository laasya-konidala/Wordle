/*
 * File: Wordle.js
 * -----------------
 * This program implements the Wordle game.
 */
"use strict";
/**
 * GAME RULES CONSTANTS
 * ---------------------
 */
const NUM_LETTERS = 5;  // The number of letters in each guess 
const NUM_GUESSES = 6;  // The number of guesses the player has to win

/**
 * SIZING AND POSITIONING CONSTANTS
 * --------------------------------
 */
const SECTION_SEP = 32; // The space between the grid, alert, and keyboard sections
const GUESS_MARGIN = 8; // The space around each guess square
const GWINDOW_WIDTH = 400;  // The width of the GWindow

// The size of each guess square (computed to fill the entire GWINDOW_WIDTH)
const GUESS_SQUARE_SIZE =
  (GWINDOW_WIDTH - GUESS_MARGIN * 2 * NUM_LETTERS) / NUM_LETTERS;

// Height of the guess section in total
const GUESS_SECTION_HEIGHT =
  GUESS_SQUARE_SIZE * NUM_GUESSES + GUESS_MARGIN * NUM_GUESSES * 2;

// X and Y position where alerts should be centered
const ALERT_X = GWINDOW_WIDTH / 2;
const ALERT_Y = GUESS_SECTION_HEIGHT + SECTION_SEP;

// X and Y position to place the keyboard
const KEYBOARD_X = 0;
const KEYBOARD_Y = ALERT_Y + SECTION_SEP;

// GWINDOW_HEIGHT calculated to fit everything perfectly.
const GWINDOW_HEIGHT = KEYBOARD_Y + GKeyboard.getHeight(GWINDOW_WIDTH);


/**
 * STYLISTIC CONSTANTS
 * -------------------
 */
const COLORBLIND_MODE = false; // If true, uses R/G colorblind friendly colors

// Background/Border Colors
const BORDER_COLOR = "#3A3A3C"; // Color for border around guess squares
const BACKGROUND_DEFAULT_COLOR = "#121213";
const KEYBOARD_DEFAULT_COLOR = "#818384";
const BACKGROUND_CORRECT_COLOR = COLORBLIND_MODE ? "#E37E43" : "#618C55"; 
const BACKGROUND_FOUND_COLOR = COLORBLIND_MODE ? "#94C1F6" : "#B1A04C";
const BACKGROUND_WRONG_COLOR = "#3A3A3C";

// Text Colors
const TEXT_DEFAULT_COLOR = "#FFFFFF";
const TEXT_ALERT_COLOR = "#B05050";
const TEXT_WIN_COLOR = COLORBLIND_MODE ? "#94C1F6" : "#618C55";
const TEXT_LOSS_COLOR = "#B05050";

// Fonts
const GUESS_FONT = "700 36px HelveticaNeue";
const ALERT_FONT = "700 20px HelveticaNeue";


/**
 * Accepts a KeyboardEvent and returns
 * the letter that was pressed, or null
 * if a letter wasn't pressed.
 */
function getKeystrokeLetter(e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return null;
  const key = e.key.toLowerCase();

  if (!/^[a-z]$/.exec(key)) return null;

  return key;
}

/**
 * Accepts a KeyboardEvent and returns true
 * if that KeyboardEvent was the user pressing
 * enter (or return), and false otherwise.
 */
function isEnterKeystroke(e) {
  return (
    !e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    (e.code === "Enter" || e.code === "Return")
  );
}

/**
 * Accepts a KeyboardEvent and returns true
 * if that KeyboardEvent was the user pressing
 * backspace (or delete), and false otherwise.
 */
function isBackspaceKeystroke(e) {
  return (
    !e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    (e.code === "Backspace" || e.code === "Delete")
  );
}

/**
 * Accepts a string, and returns if it is a valid English word.
 */
function isEnglishWord(str) {
  return true;
  // return _DICTIONARY.has(str) || _COMMON_WORDS.has(str);
}

/**
 * Returns a random common word from the English lexicon,
 * that is NUM_LETTERS long.
 * 
 * Throws an error if no such word exists.
 */
function getRandomWord() {
  const nLetterWords = [..._COMMON_WORDS].filter(
    (word) => word.length === NUM_LETTERS
  );

  if (nLetterWords.length === 0) {
    throw new Error(
      `The list of common words does not have any words that are ${NUM_LETTERS} long!`
    );
  }

  return nLetterWords[randomInteger(0, nLetterWords.length)];
}

/** Main Function */
function Wordle() {

  const gw = GWindow(GWINDOW_WIDTH, GWINDOW_HEIGHT);  
  let secret_word = getRandomWord().toUpperCase(); //creates a random secret word
  let arr = ["", "", "", "", "", ""]; //arr stores the user's word guesses
  let current_guess = ""; //stores the current word the user guesses
  let temp_guess = ""; //stores the lowercase version of current guess to check if it is an English word
  let background_color = BACKGROUND_DEFAULT_COLOR;
  let text_color = TEXT_DEFAULT_COLOR;
  let guessDone = false; //if the guess is valid, guessDone is true
  let keyboard = GKeyboard(KEYBOARD_X, KEYBOARD_Y, GWINDOW_WIDTH, TEXT_DEFAULT_COLOR, KEYBOARD_DEFAULT_COLOR);
  let guesses = 0; //stores the number of valid guesses the user has made
  let y = GUESS_MARGIN; //stores the y-position of each row 
  let in_game = true; //in_game is false when the user has won

 /*
  * Creates a grid with the updated state variables 
  */
  function draw() {
    gw.clear();
    gw.add(guessGrid(arr, 0, 0));
    gw.add(keyboard);
  }
  draw();

 /*
``* Accepts a letter, color, and position on gw
  * Returns a square that represents the user's current letter guess
  */
  function guessSquare(letter, color, x, y) {
    let box = GCompound();
    let square = GRect(x, y, GUESS_SQUARE_SIZE, GUESS_SQUARE_SIZE);
    square.setFilled(true);
    square.setColor(BORDER_COLOR);
    square.setFillColor(color);
    box.add(square);

    let label = GLabel(letter.toUpperCase(), x + (GUESS_SQUARE_SIZE)/2, y + (GUESS_SQUARE_SIZE)/2);
    label.setFont(GUESS_FONT);
    label.setColor(TEXT_DEFAULT_COLOR);
    label.setTextAlign("center"); 
    label.setBaseline("middle"); 
    box.add(label);

    return(box); //Returns a GCompound object box that includes the square and letter
  }

 /*
  * Accepts the current guess, and the location of the row in the grid 
  * Adds the correctly colored rows to the grid 
  */
  function guessRow(word, x, y) {
    y += GUESS_MARGIN; 
    let misplaced_letters = []; //creates an array of letters that aren't green 
    let x_pos = x;
    let row = GCompound(); 
    //colors is an array with the default colors of each letter in the word
    let colors = [BACKGROUND_DEFAULT_COLOR, BACKGROUND_DEFAULT_COLOR, BACKGROUND_DEFAULT_COLOR, BACKGROUND_DEFAULT_COLOR, BACKGROUND_DEFAULT_COLOR];
    let current_guess = word;

    //iterates through the word to add non-green letters to the misplaced_letters array
    //if the guessed letter is in the correct guess location, updates the colors array at that guess location to green
    for (let i = 0; i < NUM_LETTERS; i++) {
      let guessLetter = current_guess.charAt(i);
      let secretLetter = secret_word.charAt(i);

      if (guessDone) {
        if (secretLetter === guessLetter) {
          colors.splice(i, 1, BACKGROUND_CORRECT_COLOR); 
          keyboard.setKeyColor(guessLetter, BACKGROUND_CORRECT_COLOR);
        } else{
          misplaced_letters.push(secretLetter);
        }
      }
    }
    
    //iterates through the guessed word again to check if any of the letters are in the misplaced array 
    for (let k = 0; k < NUM_LETTERS; k++) {
      let guessLetter = current_guess.charAt(k);

      if (guessDone) { //if the user submitted a valid guess 
        if (colors[k] !== BACKGROUND_CORRECT_COLOR) { 
          if (misplaced_letters.includes(guessLetter)) {
            misplaced_letters.splice(misplaced_letters.indexOf(guessLetter), 1); //removes the element from misplaced array at k
            colors.splice(current_guess.indexOf(guessLetter), 1, BACKGROUND_FOUND_COLOR); //replaces the element in colors with the correct color (yellow)
            
            //if the on-screen keyboard key isn't already green, then set it to yellow
            if (keyboard.getKeyColor(guessLetter) != BACKGROUND_CORRECT_COLOR) { 
              keyboard.setKeyColor(guessLetter, BACKGROUND_FOUND_COLOR);
            }
          } else { //if the guessed letter isn't in the secret word, replace the element in colors with the wrong color (dark grey)
            colors.splice(k, 1, BACKGROUND_WRONG_COLOR);
            //if the keyboard key isn't green or yellow or empty, set the key to the wrong color (dark grey)
            if (guessLetter !== "" && keyboard.getKeyColor(guessLetter) != BACKGROUND_CORRECT_COLOR && keyboard.getKeyColor(guessLetter) != BACKGROUND_FOUND_COLOR){
              keyboard.setKeyColor(guessLetter, BACKGROUND_WRONG_COLOR);
            }
          }
        }
      }
      x_pos += GUESS_MARGIN;
      row.add(guessSquare(guessLetter, colors[k], k * GUESS_SQUARE_SIZE + x_pos, y)); //adds the correctly colored square to the row 
      x_pos += GUESS_MARGIN;
    }
    gw.add(row);
    return row;
  }

  /*
  * Accepts the array of guessed words and the location of the row, and returns a grid with the guessed words 
  */
  function guessGrid(arr, x, y) {
    let grid = GCompound();
    for (let i = guesses; i < NUM_GUESSES; i++) {
      grid.add(guessRow(arr[i], 0, i * (GUESS_SQUARE_SIZE + GUESS_MARGIN)));
    }
    return grid;
  }
 
  /*
  * Accepts a text message and color, and returns an alert message
  */
  function makeAlert(message, color) {
    let msg = GLabel(message, ALERT_X, ALERT_Y);
    msg.setColor(color);
    msg.setFont(ALERT_FONT);
    msg.setTextAlign("center");
    msg.setBaseline("middle");
    gw.add(msg);
  }
  
  /*
  * Keyclick function
  * Accepts the letter the user clicks on
  * Adds the updated grid to the gw
  */
  function buildWord(e) {
    if (in_game) { //if the user hasn't won yet
      let letter = e;
      if (current_guess.length < NUM_LETTERS) {
        temp_guess += letter.toLowerCase();
        current_guess += letter.toUpperCase();
        arr[guesses] = current_guess;
        gw.add(guessGrid(arr, 0, guesses));
      }
    }
  }

  /*
  * Backspace function
  * Removes the element from the screen and current guess if backspace is hit
  */
  function deleteLetter() {
    if (current_guess.length > 0){
      current_guess = current_guess.substring(0, current_guess.length - 1);
      arr[guesses] = current_guess;
      guessGrid(arr, 0, 0);  
    }
  }

  /*
  * Enter function
  * Checks if the current guess is valid when the user enters a guess
  */ 
  function enterWord() {
    if (!isEnglishWord(temp_guess)) { //alerts the user if the word isn't English
      deleteAlert();
      makeAlert((current_guess + " is not a word!"), TEXT_ALERT_COLOR);    
    }
    if (current_guess === secret_word) { //if the user correctly guesses the word 
      deleteAlert();
      makeAlert("You win!", TEXT_WIN_COLOR);
      in_game = false; 
    }
    if (guesses == NUM_GUESSES - 1 && current_guess !== secret_word) { //if the user is out of guesses and does not guess the word 
      deleteAlert();
      makeAlert("You lost! The secret word was " + secret_word, TEXT_ALERT_COLOR);
      in_game = false;
    }
    if (current_guess.length == NUM_LETTERS && isEnglishWord(temp_guess)) { //if the user submits a valid guess 
      guessDone = true;
      gw.add(guessGrid(arr, 0, guesses));
      current_guess = "";
      temp_guess = "";
      guesses++;
    }
    guessDone = false;
  }

  /*
  * Clears the alert from the screen
  */
  function deleteAlert() {
    let element = gw.getElementAt(ALERT_X + 1, ALERT_Y + 1)
    if (element !== null) {
      gw.remove(element);
    }
  }
 
  keyboard.addEventListener("keyclick", buildWord); 
  keyboard.addEventListener("enter", enterWord);
  keyboard.addEventListener("backspace", deleteLetter);

  /*
  * Allows the user to use the physical keyboard 
  */
  function useKeyboard(e) {
    if (isEnterKeystroke(e)) {
      enterWord();
    }
    else if (isBackspaceKeystroke(e)) {
      deleteLetter();
    } else {
      let keyInput = getKeystrokeLetter(e);
      buildWord(keyInput);
    }
  }
  gw.addEventListener("keydown", useKeyboard);
}