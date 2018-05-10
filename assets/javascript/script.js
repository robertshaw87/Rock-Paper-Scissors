var userID, userName, oppID;
var inQueue = false;
var currPlaying = false;

var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connectedStatus = database.ref(".info/connected");


var connected = false;

function generateHash() {
    connectionsRef.once("value", function(snapshot) {
        var tempID, exists;
        do {
            exists = false;
            tempID = userName + "-" + Math.floor(Math.random() * 100);
            snapshot.forEach(function(childsnap){
                if (childsnap.val().id === tempID.toString()){
                    exists = true;
                }
            });
        } while (exists);
        var tempCon = connectionsRef.push(tempID);   
        tempCon.onDisconnect().remove();
        return tempID;
    });
}

connectedStatus.on("value", function(snapshot) {
    if (snapshot.val()) {
        inQueue = true;
    }
});

connectionsRef.on("value", function (snapshot) {
   connectionsRef.limitToFirst(2).on("value", function(snap){
        console.log("first 2: ")
        console.log(snap.val())
        snapKeys = Object.keys(snap.val());
        if (((snapKeys.length) < 2) && !currPlaying) {
            database.ref("/chat").remove();
        }
        var PlayerOne = snap.val()[snapKeys[0]];
        var PlayerTwo = snap.val()[snapKeys[1]];
        var tempID = PlayerOne.split(" ").join("");
        $("#"+tempID).text(PlayerOne + " (Player 1)");
        tempID = PlayerTwo.split(" ").join("");
        $("#"+tempID).text(PlayerTwo + " (Player 2)");
    })
});

connectionsRef.on("child_removed", function(snapshot) {
    if (snapshot.val() == oppID){
        console.log("Disconnect:")
        console.log(snapshot.val())
        var dcMessage = snapshot.val() + " has disconnected.";
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
    userID = generateHash();
    } else {
        $("#username-message").text("You're not yet connected! Please try again.")
    }
});

$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    var chat = userID + ": " + $("#chat-input").val().trim();
    $("#chat-input").val("");
    if (curPlaying) {
        database.ref("/chat").push(chat);
    }
});

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})