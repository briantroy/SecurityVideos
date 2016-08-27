/**
 * Created by brian.roy on 8/20/16.
 */

var camlist;


$( document ).ready(function() {
    $(".navigation").hide();
    $("#usrimg").hide();
    $("#log-out").hide();
    $("#video-container").hide();
    $("#page-nav").hide();
});

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var auth_resp = googleUser.getAuthResponse();
    document.getElementById('usrimg').src=profile.getImageUrl();
    jQuery.data(document.body, 'authData', auth_resp);
    $(".navigation").show();
    $("#usrimg").show();
    $("#log-out").show();
    $(".g-signin2").hide();
    getLatestVideos(auth_resp.id_token);
    getCameraList(auth_resp.id_token);

}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        $(".video-list").remove();
        $(".navigation").hide();
        $(".g-signin2").show();
        $("#usrimg").hide();
        $("#log-out").hide();
    });
}


