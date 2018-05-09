var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connectedStatus = database.ref(".info/connected");

var userID;
var connected = false;

function generateHash() {
    connectionsRef.once("value", function(snapshot) {
        var tempID, exists;
        do {
            exists = false;
            tempID = Math.floor(Math.random() * 1000000);
            snapshot.forEach(function(childsnap){
                if (childsnap.val().id === tempID.toString()){
                    exists = true;
                }
            });
        } while (exists);
        var connectionItem = {
            id: tempID.toString(),
            name: "player " + tempID.toString(),
            status: "queue"
        }
        var tempCon = connectionsRef.push(connectionItem);   
        tempCon.onDisconnect().remove();
        return tempID;
    });
}

connectedStatus.on("value", function(snapshot) {
    if (snapshot.val()) {
        userID = generateHash();
        
    }
});

connectionsRef.on("child_removed", function(snapshot) {
    if (snapshot.val().statu !== "queue"){
        var dcMessage = snapshot.val().name + " has disconnected.";
        database.ref("/chat").push(dcMessage);
    }
});

connectionsRef.on("value", function (snapshot) {
    console.log(snapshot.val())
    $("#connected").append($("<p>").text(snapshot.val().id))
});

$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    
    var chat = $("#chat-input").val().trim();
    $("#chat-input").val("");

    database.ref("/chat").push(chat);
    
    database.ref("/chat").limitToFirst(2).on("value", function(snap){
    })
});

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})