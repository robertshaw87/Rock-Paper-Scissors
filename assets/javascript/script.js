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

function messageArea(str){
    $("#messages").html($("<h2>").addClass("col text-center mt-5").text(str));
}

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

database.ref("/chat").on("value", function (snapshot){
    if (snapshot.val()){
        var chatObj = snapshot.val();
        var tempKeys = Object.keys(snapshot.val());
        for (var i=maxChat; i<tempKeys.length; i++) {
            database.ref("/chat").child(tempKeys[i-maxChat]).remove();
        }
    }
})

connectionsRef.on("value", function (snapshot) {
   connectionsRef.limitToFirst(2).on("value", function(snap){
        if (!snap.val()) {
            return;
        }
        snapKeys = Object.keys(snap.val());
        if (snapKeys.length < 2) {
            return;
        }
        var playerOne = snap.val()[snapKeys[0]];
        var playerTwo = snap.val()[snapKeys[1]];
        var tempID = playerOne.split(" ").join("");
        $("#"+tempID).text(playerOne + " (Player 1)");
        tempID = playerTwo.split(" ").join("");
        $("#"+tempID).text(playerTwo + " (Player 2)");
        if (playerOne === userID || playerTwo === userID){
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

connectionsRef.on("child_removed", function(snapshot) {
    if (snapshot.val() === oppID){
        var dcMessage = snapshot.val() + " has been vanquished by " + userID + ".";
        messageArea("You have conquered " + oppID + "! Congratulations.")
        oppID = undefined;
        playersDefeated++;
        database.ref("/chat").push(dcMessage);
    }
    var tempID = snapshot.val().split(" ").join("");
    $("#"+tempID).remove();
});

connectionsRef.on("child_added", function (snapshot) {
    var tempID = snapshot.val().split(" ").join("");
    $("#connected").append($("<p>").attr("id", tempID).text(snapshot.val()))
});

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})

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

$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    var chat = userID + ": " + $("#chat-input").val().trim();
    $("#chat-input").val("");
    if (currPlaying) {
        database.ref("/chat").push(chat);
    }
});

$(document).on("click", ".rpsChoice", function(event){
    choice = $(this).data("rps");
    console.log(choice)

    messageArea("You chose " + choice + ". Waiting on your opponent.");
    database.ref("/rps/" + playerNum).set({
        name: userID,
        rps: choice,
        ready: true
    })
})

database.ref("/rps").on("value", function(snapshot){
    console.log(snapshot.val())
    if (snapshot.val()[opponentNum] && snapshot.val()[playerNum]){
        if (snapshot.val()[opponentNum].ready && snapshot.val()[playerNum].ready){
            var playerChoice = snapshot.val()[playerNum].rps;
            var opponentChoice = snapshot.val()[opponentNum].rps;
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