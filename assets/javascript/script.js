var userID, userName, oppID;
var inQueue = false;
var currPlaying = false;
var maxChat = 30;
var playerNum, opponentNum, choice;
var wins = 0;
var losses = 0;
var playersDefeated = 0;

var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connectedStatus = database.ref(".info/connected");


var connected = false;

// generate a unique player ID for each player
function generateHash() {
    connectionsRef.once("value", function(snapshot) {
        var exists;
        do {
            exists = false;
            userID = userName + "-" + Math.floor(1 + Math.random() * 9) + Math.floor(1 + Math.random() * 9);
            snapshot.forEach(function(childsnap){
                if (childsnap.val().id === userID.toString()){
                    exists = true;
                }
            });
        } while (exists);
        var tempCon = connectionsRef.push(userID);   
        tempCon.onDisconnect().remove();
    });
}

// show the score card in the top left corner
// relevant classes used here:
// player-card-header, player-card-body
// relevant ids defined here:
// player-wins, player-losses, player-defeated
function showScore() {
    var wrapperCard = $("<div>");
    wrapperCard.addClass("Card bg-light");

    var cardHeader = $("<h3>").addClass("card-header bg-dark text-light p-2 text-center player-card-header");
    cardHeader.text("Your Score");
    wrapperCard.append(cardHeader);
    
    var cardWins = $("<span>").attr("id", "player-wins");
    cardWins.text(wins);
    
    var cardWinsWrapper = $("<h6>").addClass("card-body player-card-body");
    cardWinsWrapper.text("Wins: ");
    cardWinsWrapper.append(cardWins);
    wrapperCard.append(cardWinsWrapper);
    
    var cardLosses = $("<span>").attr("id", "player-losses");
    cardLosses.text(losses);
    
    var cardLossesWrapper = $("<h6>").addClass("card-body player-card-body");
    cardLossesWrapper.text("Losses: ");
    cardLossesWrapper.append(cardLosses);
    wrapperCard.append(cardLossesWrapper);
    
    var cardDefeated = $("<span>").attr("id", "player-defeated");
    cardDefeated.text(playersDefeated);
    
    var cardDefeatedWrapper = $("<h6>").addClass("card-body player-card-body");
    cardDefeatedWrapper.text("Players Defeated: ");
    cardDefeatedWrapper.append(cardDefeated);
    wrapperCard.append(cardDefeatedWrapper);
    
    $("#player-one").html(wrapperCard);
}

// render the rock paper scissors selection images
// choice stored as string in data-rps attribute
// all images use the rpsChoice class
function rpsSelect() {
    $("#messages").empty();

    var rock = $("<img>").attr("src", "assets/images/rock.png");
    rock.attr("alt", "rock");
    rock.addClass("rpsChoice");
    rock.data("rps", "rock")
    $("#messages").append($("<div>").addClass("col-4").html(rock));

    var paper = $("<img>").attr("src", "assets/images/paper.png");
    paper.attr("alt", "paper");
    paper.addClass("rpsChoice");
    paper.data("rps", "paper")
    $("#messages").append($("<div>").addClass("col-4").html(paper));

    var scissors = $("<img>").attr("src", "assets/images/scissors.png");
    scissors.attr("alt", "scissors");
    scissors.addClass("rpsChoice");
    scissors.data("rps", "scissors")
    $("#messages").append($("<div>").addClass("col-4").html(scissors));
}

// displays the string provided as an argument in the messages area
// which is where the RPS choices also appear
function messageArea(str){
    $("#messages").html($("<h2>").addClass("col text-center mt-5").text(str));
}

// displays waiting screen upon connecting
connectedStatus.on("value", function(snapshot) {
    if (snapshot.val()) {
        inQueue = true;
        messageArea("Welcome to the queue. The game will begin shortly.")
        var rpsWait = $("<img>").attr("src", "assets/images/rps-animate.gif");
        rpsWait.attr("alt", "Rock Paper Scissors");
        rpsWait.addClass("rpsWait");
        $("#player-one").html(rpsWait);
    }
});

// removes older chat entries. The maximum chats stored is defied by the maxChat variable
database.ref("/chat").on("value", function (snapshot){
    if (snapshot.val()){
        var chatObj = snapshot.val();
        var tempKeys = Object.keys(snapshot.val());
        for (var i=maxChat; i<tempKeys.length; i++) {
            database.ref("/chat").child(tempKeys[i-maxChat]).remove();
        }
    }
})

// check to see if the player is at the head of the queue and thus a player
// monitor the list of connections for changes
connectionsRef.on("value", function (snapshot) {
    // only look at the first two of the connections list
   connectionsRef.limitToFirst(2).on("value", function(snap){
    //    is there isn't anyone connected, don't do anything
        if (!snap.val()) {
            return;
        }
        // grab the two keys for the connection list and check to make sure
        // a second player was connected
        snapKeys = Object.keys(snap.val());
        if (snapKeys.length < 2) {
            return;
        }
        var playerOne = snap.val()[snapKeys[0]];
        var playerTwo = snap.val()[snapKeys[1]];
        // change the text of the queue to reflect the new players
        var tempID = playerOne.split(" ").join("");
        $("#"+tempID).text(playerOne + " (Player 1)");
        tempID = playerTwo.split(" ").join("");
        $("#"+tempID).text(playerTwo + " (Player 2)");

        // check to see if the user is now at the front of the queue and not already playing a game
        if ((playerOne === userID || playerTwo === userID) && !currPlaying){
            currPlaying = true;
            $("#chat-box").removeClass("hidden");
            if (playerOne === userID){
                playerNum = "playerOne";
                opponentNum = "playerTwo";
                oppID = playerTwo;
            } else {
                playerNum = "playerTwo";
                opponentNum = "playerOne"
                oppID = playerOne;
            }
            // display a welcome message, show the score, initialise the RPS selection object in firebase
            // also set a timer to move on to RPS selection after 3 seconds
            $("#player-chat-header").text("Welcome to the game, " + userID)
            showScore();
            messageArea("You meet " + oppID + " on the field of battle. " +"Get ready to ROCK, PAPER, SCISSORS!");
            database.ref("/rps/" + playerNum).set({
                name: userID,
                rps: "none",
                ready: false
            })
            setTimeout(rpsSelect, 3000);
        }
        
    })
});

// check the connections list for people leaving
connectionsRef.on("child_removed", function(snapshot) {
    // if your opponent left
    if (snapshot.val() === oppID){
        // victor message in message area and chat
        var dcMessage = snapshot.val() + " has been vanquished by " + userID + ".";
        messageArea("You have conquered " + oppID + "! Congratulations.")
        oppID = undefined;
        playersDefeated++;
        currPlaying = false;
        database.ref("/chat").push(dcMessage);
    }
    // remove the player who left from the queue
    var tempID = snapshot.val().split(" ").join("");
    $("#"+tempID).remove();
});

// when a new player joins(or upon connect) show the queue
connectionsRef.on("child_added", function (snapshot) {
    var tempID = snapshot.val().split(" ").join("");
    $("#connected").append($("<p>").attr("id", tempID).text(snapshot.val()))
});

// when a new chat message appears, scroll to the bottom of the chat window and 
// display it in the chat box
database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})

// runs each time anything in the rps subdirectory in firebase changes
database.ref("/rps").on("value", function(snapshot){
    // make sure both players are present
    if (snapshot.val()[opponentNum] && snapshot.val()[playerNum]){
        if (snapshot.val()[opponentNum].ready && snapshot.val()[playerNum].ready){
            // save the choices players made
            var playerChoice = snapshot.val()[playerNum].rps;
            var opponentChoice = snapshot.val()[opponentNum].rps;
            // if the player won
            if ((playerChoice === "rock" && opponentChoice === "scissors") ||
                (playerChoice === "paper" && opponentChoice === "rock") ||
                (playerChoice === "scissors" && opponentChoice === "paper")){
                    wins++;
                    showScore();
                    messageArea("Congratulations, " + userID + "! You defeated " + oppID + "'s " + opponentChoice + " with your " + playerChoice + "! Prepare for a rematch!");
                    database.ref("/rps/" + playerNum).set({
                        name: userID,
                        rps: "none",
                        ready: false
                    })
                    setTimeout(rpsSelect, 3000);
                    // if the player lost
            } else if ((opponentChoice === "rock" && playerChoice === "scissors") ||
                        (opponentChoice === "paper" && playerChoice === "rock") ||
                        (opponentChoice === "scissors" && playerChoice === "paper")){
                    losses++;
                    showScore();
                    messageArea("You lost to " + oppID + "'s " + opponentChoice + " with your " + playerChoice + ". Better luck next time!");
                    database.ref("/rps/" + playerNum).set({
                        name: userID,
                        rps: "none",
                        ready: false
                    })
                    setTimeout(rpsSelect, 3000);
            } else {
                // you tied with the opponent
                showScore();
                messageArea("Both you and " + oppID + " chose " + playerChoice + "! Prepare for a rematch!");
                database.ref("/rps/" + playerNum).set({
                    name: userID,
                    rps: "none",
                    ready: false
                })
                setTimeout(rpsSelect, 3000);
            }
        }
    }
})

// when the user picks a name, reveal the rest of the website and generate an id
// for the player using that name.
$(document).on("click", "#name-submit", function(event){
    event.preventDefault();
    if (inQueue){
    userName = $("#name-input").val().trim();
    $("#name-input").val("");
    $("#rps-body").removeClass("hidden");
    $("#start-username").addClass("hidden");
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
    generateHash();
    } else {
        $("#username-message").text("You're not yet connected! Please try again.")
    }
});

// only allow chat messages to be saved to the database if the current user is actually playing
$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    var chat = userID + ": " + $("#chat-input").val().trim();
    $("#chat-input").val("");
    if (currPlaying) {
        database.ref("/chat").push(chat);
    }
});

// update the database upon the player choosing a handsign, ready token is for asynchronous logic
$(document).on("click", ".rpsChoice", function(event){
    choice = $(this).data("rps");
    messageArea("You chose " + choice + ". Waiting on your opponent.");
    database.ref("/rps/" + playerNum).set({
        name: userID,
        rps: choice,
        ready: true
    })
})