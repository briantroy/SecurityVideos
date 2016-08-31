/**
 * Created by brian.roy on 8/20/16.
 */

var camlist;
var user_token;


$( document ).ready(function() {
    $(".navigation").hide();
    $(".options").hide();
    $("#usrimg").hide();
    $("#log-out").hide();
    $("#video-container").hide();
    $("#page-nav").hide();
    $("#page-opts").hide();
    setDefaultVideoResoloution();
});

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var auth_resp = googleUser.getAuthResponse();
    document.getElementById('usrimg').src=profile.getImageUrl();
    $(".identity-name").append(profile.getName() + "<br/>" + profile.getEmail());
    jQuery.data(document.body, 'authData', auth_resp);
    $("#usrimg").show();
    $("#log-out").show();
    $(".g-signin2").hide();
    user_token = auth_resp.id_token;
    getCameraList(user_token);

}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        $(".video-list").remove();
        $(".navigation").hide();
        $(".options").hide();
        $(".g-signin2").show();
        $("#usrimg").hide();
        $("#log-out").hide();
    });
}


