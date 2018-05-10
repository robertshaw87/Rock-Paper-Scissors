var userID, userName, oppID;
var inQueue = false;
var currPlaying = false;
var maxChat = 30;
var playerNum;

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

connectedStatus.on("value", function(snapshot) {
    if (snapshot.val()) {
        inQueue = true;
    }
});

database.ref("/chat").on("value", function (snapshot){
    if (snapshot.val()){
        var chatObj = snapshot.val();
        var tempKeys = Object.keys(snapshot.val());
        console.log(tempKeys)
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
        console.log("first 2: ")
        console.log(snap.val())
        snapKeys = Object.keys(snap.val());
        console.log(snapKeys)
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
                playerNum = 1;
                oppID = playerTwo;
            } else {
                playerNum = 2;
                oppID = playerOne;
            }
        }
        
    })
});

connectionsRef.on("child_removed", function(snapshot) {
    if (snapshot.val() == oppID){
        console.log("Disconnect:")
        console.log(snapshot.val())
        var dcMessage = snapshot.val() + " has disconnected.";
        oppID = undefined;
        database.ref("/chat").push(dcMessage);
    }
    var tempID = snapshot.val().split(" ").join("");
    $("#"+tempID).remove();
});

connectionsRef.on("child_added", function (snapshot) {
    var tempID = snapshot.val().split(" ").join("");
    $("#connected").append($("<p>").attr("id", tempID).text(snapshot.val()))
});

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

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})