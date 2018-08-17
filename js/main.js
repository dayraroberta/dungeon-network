let database = firebase.database();
let storage = firebase.storage();
var filterView = $(".filter-view");
var USER_ID = window.location.search.match(/\?id=(.*)/)[1];
const MAX_CHAR = 300;
console.log(USER_ID);

$(document).ready(function() {
  getUserName();

  // GET NAME LOGGED USER
  function getUserName() {
    database.ref(`/user/${USER_ID}`).once("value")
    .then(function(snapshot) {
        var displayName = snapshot.val().displayName;
        setUserName(displayName);
        getPostsDB(displayName);
    });
  }

  // SET NAME LOGGER USER IN PROFILE
  function setUserName(name) {
    var userName = $(".user-name");
    userName.text(name);
  }

  // GET ALL POSTS OF USER IN LOAD DB
  function getPostsDB(name, filter){
    database.ref(`/user-posts/${USER_ID}`).on("child_added", function (privateData) {
      var privateKey = privateData.key;
      var privateAuthor = name;
      var privateText = privateData.val().text;
      var privateFilter = privateData.val().filter;
      var privateLikes = privateData.val().like;
      printPosts(privateKey, privateAuthor, privateText, privateFilter, privateLikes);
    });
  }

  // GET PERSONAL POSTS DB
  function getPersonalPostsDB(){
    database.ref(`/user/${USER_ID}`).once("value")
    .then(function(snapshot) {
        var displayName = snapshot.val().displayName;
        database.ref(`/user-posts/${USER_ID}`).on("child_added", function (privateData) {
          var privateKey = privateData.key;
          var privateAuthor = displayName;
          var privateText = privateData.val().text;
          var privateFilter = privateData.val().filter;
          var privateLikes = privateData.val().like;
          printPosts(privateKey, privateAuthor, privateText, privateFilter, privateLikes);
        });
    });
  }

  // GET ALL PUBLIC POSTS
  function getPublicPostsDB() {
    database.ref(`/posts/`).once("value")
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var publicKey = childSnapshot.key;
        var publicAuthor = childSnapshot.val().authorName;
        var publicText = childSnapshot.val().text;
        var publicFilter = childSnapshot.val().filter;
        var publicLikes = childSnapshot.val().like;
        if (publicFilter === "public") {
          printPosts(publicKey, publicAuthor, publicText, publicFilter, publicLikes);
        }
      });
    });
  }

  // GET FRIENDS POSTS DB
    function getFriendsPostsDB() {
      database.ref(`friends/${USER_ID}`).once("value")
      .then(function(friendsListSnapshot) {
        friendsListSnapshot.forEach(function(friendSnapshot){
          var friendData = friendSnapshot.val();
          var friendFollowedName = friendData.friendName;
          var friendFollowedID = friendData.friendId;

          database.ref(`user-posts/${friendFollowedID}`).once('value')
          .then(function(friendPostSnapshot) {
            friendPostSnapshot.forEach(function(eachFriendPost) {
              var friendPostKey = eachFriendPost.key;
              var friendPostAuthor = friendFollowedName;
              var friendPostText = eachFriendPost.val().text;
              var friendPostFilter = eachFriendPost.val().filter;
              var friendPostLikes = eachFriendPost.val().like;
              if (friendPostFilter === "friends"){
                printPosts(friendPostKey, friendPostAuthor, friendPostText, friendPostFilter, friendPostLikes);
              }
            });
          });
        });
      });
    }

  // PRINT POSTS IN HTML
  function printPosts(key, author, text, filter, likes) {
    $(".posts-list").prepend(`
      <li class="box-post mb-2 pl-1 pt-2" data-post-key=${key}>
        <h4 class="ml-2"> ${author} </h4>
        <p class="text-wrap ml-2" data-text-key=${key}> ${text} </p>
        <div class="d-flex flex-wrap justify-content-end mt-3">
          <div class="d-flex align-items-center">
            <p class="likes-count mr-1" data-countlike-id="${key}"> ${likes} </p>
            <button class="like-btn form-btn post-btn my-3 mr-2 py-1 px-1" data-like-id="${key}"> Life! </button>
          </div>
          <button class="edit-btn form-btn post-btn my-3 mr-2 py-1 px-1" data-edit-id=${key}> Edit </button>
          <button class="del-btn form-btn post-btn my-3 mr-2 py-1 px-1" data-del-id=${key}> Delete </button>
        </div>
      </li>
    `);
    if (filterView.val() === "public" || filterView.val() === "friends") {
      $(`button[data-del-id=${key}]`).hide();
      $(`button[data-edit-id=${key}]`).hide();
    }
    likePosts($(`button[data-like-id=${key}]`), $(`p[data-countlike-id=${key}]`), likes, key);
    deletePosts($(`input[data-post-key=${key}]`), $(`button[data-del-id=${key}]`), key);
    editPosts(text, $(`button[data-edit-id=${key}]`), key);
    // filterPostsToView(filter);
  }

  //LIKE POSTS
  function likePosts(buttonID, likesID, likes, key) {
    buttonID.click(function(){
      console.log("henlo!!");
      likesID.html(`${likes += 1}`);
      database.ref(`/user-posts/${USER_ID}/${key}`).update({
        like: likes
      });
    });
  }

  // DELETE POSTS
  function deletePosts(postId, buttonId, key) {
    buttonId.click(function() {
      database.ref(`/user-posts/${USER_ID}/${key}`).remove();
      $(`li[data-post-key=${key}]`).remove();
    });
  }

  // EDIT POSTS
  function editPosts(text, buttonId, key) {
    buttonId.click(function() {
      $("#edit-post").modal();
      $(".modal-body").empty();
      $(".modal-body-edit").prepend(`
        <textarea class="post-textarea edit-post h-100 w-100" data-area-id=${key} />
      `);
      $(".edit-post").text(`${text}`);
      $(".save-btn").click(function() {
        var editedText = $(".edit-post").val();
        database.ref(`/user-posts/${USER_ID}/${key}`).update({
          text: editedText
        });
        $(`p[data-text-key=${key}]`).text(editedText);
      });
    });
  }

  // SEND NEW POSTS
  $(".send-btn").click(function(event) {
    event.preventDefault();

    database.ref("user/" + USER_ID).once("value")
    .then(function(snapshot) {
      var displayName = snapshot.val().displayName;
      console.log(displayName);

      var newPostKey = database.ref().child("posts").push().key;
      var filterPost = $(".filter-posts").val();
      var newPost = $(".post-textarea").val();
      $(".post-textarea").val("");
      $(".character-count").text(MAX_CHAR);
      $(".send-btn").prop("disabled", true);
      $(".send-btn").css("opacity", "0.5");
      var postInfo = {
        author: USER_ID,
        authorName: displayName,
        text: newPost,
        filter: filterPost,
        like: 0
      };

      if (filterPost === "public" && filterPost !== "none") {
        database.ref(`/posts/${newPostKey}`).set(postInfo);
      }
        database.ref(`/user-posts/${USER_ID}`).push(postInfo);
    });
  });

  // BLOCK BUTTON AND CHAR COUNT
  document.getElementById("post-textarea").addEventListener('input', function () {
    var upArea = this.value;
    var nChar = upArea.split('').length;
    var result = $(".character-count").html(MAX_CHAR - nChar);
    if (upArea.value === null){
      $(".send-btn").prop("disabled", true);
    }
    if (nChar > 0 && nChar <= MAX_CHAR){
      $(".send-btn").prop("disabled", false);
      $(".send-btn").css("opacity", "1");
    } else {
      $(".send-btn").prop("disabled", true);
      $(".send-btn").css("opacity", "0.5");
    }
  });

  // GET USERNAME AND KEY TO FOLLOW LIST
  database.ref("user").once("value")
  .then(function(snapshot){
    snapshot.forEach(function(childSnapshot){
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      createUsers(childData.displayName, childKey);
    });
  });

  // FOLLOW USERS
  function createUsers(displayName, key){
    if (key !== USER_ID) {
      $(".users-list").append(`
        <li class="d-flex align-items-center my-2">
          <button class="follow-btn form-btn post-btn py-1 px-3 mr-2" data-user-id="${key}"> Add to party!</button>
          <span>${displayName}</span>
        </li>
      `);
    }
    $(`button[data-user-id=${key}]`).click(function() {
      database.ref(`/friends/${USER_ID}`).push({
        friendName: displayName,
        friendId: key
      });
      alert(`You add ${displayName} to your party!`);
    });
  }

  // LOGOUT
  $('.logout-btn').click(function() {
    firebase.auth().signOut()
    .then(function() {
      window.location = "index.html";
    })
    .catch(function(error) {
    alert(error.message);
    });
  });

  // FILTER TO VIEW POSTS BY TYPE
  // function filterPostsToView(filter) {
    filterView.change(function() {
      console.log(filterView.val());
      $(".posts-list").empty();
      if (filterView.val() === "public") {
        getPublicPostsDB();
      }
      if (filterView.val() === "friends") {
        getFriendsPostsDB();
      }
      if (filterView.val() === "private") {
        getPersonalPostsDB();
      }
    });

});
