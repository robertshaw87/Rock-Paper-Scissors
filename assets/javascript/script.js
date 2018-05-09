var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connectedStatus = database.ref(".info/connected");

var userID;

function generateHash() {
    connectionsRef.once("value", function(snapshot) {
        var tempID, exists;
        do {
            exists = false;
            tempID = Math.floor(Math.random() * 1000000);
            snapshot.forEach(function(childsnap){
                if (childsnap.val() === tempID.toString()){
                    exists = true;
                }
            });
        } while (exists);
        var tempCon = connectionsRef.push(tempID.toString());   
        tempCon.onDisconnect().remove();
        return tempID;
    });
}

connectedStatus.on("value", function(snapshot) {
    if (snapshot.val()) {
        userID = generateHash();
        
    }
});



connectionsRef.on("value", function (snapshot) {
    $("#connected").empty();
    console.log(snapshot.val())
    var queue = Object.keys(snapshot.val())
    queue.forEach(function (child){
        $("#connected").append($("<p>").text(snapshot.val()[child]))
    })

});

$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    
    var chat = $("#chat-input").val().trim();
    $("#chat-input").val("");

    database.ref("/chat").push(chat);
    
    database.ref("/chat").limitToFirst(2).on("value", function(snap){
        console.log("WELKIGHDSL ", snap.val())
    })
});

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})