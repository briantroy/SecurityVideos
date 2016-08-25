/**
 * Created by brian.roy on 8/20/16.
 */

var camlist;

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());
    var auth_resp = googleUser.getAuthResponse();
    document.getElementById('usrimg').src=profile.getImageUrl();
    jQuery.data(document.body, 'authData', auth_resp);
    var tHTML = "<button type='button' onclick='refreshVideos(\"" + auth_resp.id_token + "\")'>Refresh</button>";
    tHTML += "<button type='button' onclick='showTimeline(\"latest\")'>latest</button>";
    $("#list-controls").append(tHTML);
    getLatestVideos(auth_resp.id_token);
    getCameraList(auth_resp.id_token);

}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
}

