var database = firebase.database();

var connectionsRef = database.ref("/connections");
var connected = database.ref(".info/connected");

var userID;
connected.on("value", function(snapshot) {

    // console.log(snapshot.val())

    if (snapshot.val()) {
        // userID = generateHash();
        var tempCon = connectionsRef.push(false);
        tempCon.onDisconnect().remove();
    }
    // if (snapshot.val()) {
    //     var exists = true;
    //     do {
    //     userID = generateHash();
    //     connectionsRef.child(userID).once("value", function(snapshot2) {
    //         exists = snapshot2.val() !== null;
    //     });
    //     } while (exists);
        
    //     var con = connectionsRef.push(userID);

    //     con.onDisconnect().remove();
    // }
});

connectionsRef.on("child_added", function (childSnapshot, prevChildKey) {
    $("#connected").append(childSnapshot.val())
});

$(document).on("click", "#chat-submit", function(event){
    event.preventDefault();
    
    var chat = $("#chat-input").val().trim();
    $("#chat-input").val("");

    database.ref("/chat").push(chat);
});

database.ref("/chat").on("child_added", function (childSnapshot, prevChildKey) {
    $("#chat-display").append($("<p>").text(childSnapshot.val()));
    $("#chat-display").scrollTop($("#chat-display").prop("scrollHeight"));
})

function generateHash() {
    var tempID = Math.floor(Math.random() * 999999);
    connectionsRef.once("value", function(snapshot) {
        if (snapshot.child(tempID).val() !== null) {
            return generateHash();
        } else {
            return tempID;
        }
    });
}
console.log(generateHash())