var database = firebase.database();

$(document).ready(function() {
  $(".signin-btn").click(function(event) {
    event.preventDefault();
    var email = $(".email").val();
    var password = $(".password").val();
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(response) {
      window.location = "main.html?id=" + response.user.uid;
    })
    .catch(function(error) {
      handleError(error);
    });
  });

  $(".start-btn").click(function(event) {
    event.preventDefault();
    window.location= "register.html";
  });

  $(".signup-btn").click(function(event) {
    event.preventDefault();
    var nickname = $(".nickname").val();
    var email = $(".email").val();
    var password = $(".password").val();
    var birthday = $(".birthday").val();
    var country = $(".country").val();
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function(response) {
      var USER_ID = response.user.uid;
      database.ref("/user/" + USER_ID).set({
        displayName: nickname,
        userEmail: email,
        userPassword: password,
        userID: USER_ID,
        userDateOfBorn: birthday,
        userCountry: country
      });
      window.location = "main.html?id=" + USER_ID;
    })
    .catch(function(error) {
      handleError(error);
    });
  });

  $(".return-btn").click(function(event) {
    event.preventDefault();
    window.location= "index.html";
  });

  function handleError(error) {
    var errorMessage = error.message;
    alert(errorMessage);
  }
});
