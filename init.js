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
    $("#image-container").hide();
    $("#image-timeline").hide();
    $("#page-nav").hide();
    $("#page-opts").hide();
    setDefaultVideoResoloution();

    jQuery.data(document.body, 'view_scope', 'latest');
    jQuery.data(document.body, 'page_request_inflight', 0);


    $("#show-images-opt").change(function() {
        if (this.checked) {
            showTimeline('latest', 'options')
        } else {
            showTimeline('latest', 'options');
        }
    })
    $(window).scroll(function () {
        if (($(document).height()) <= $(window).scrollTop() + $(window).height()) {
            // console.log("End Of The Page for: " + jQuery.data(document.body, 'view_scope'));
            if (jQuery.data(document.body, 'page_request_inflight') == 0) {
                jQuery.data(document.body, 'page_request_inflight', 1);
                loadNextVideos(jQuery.data(document.body, 'view_scope'));
            }
        }
    });

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
    $(".options").show();
    getCameraList(user_token);

}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        $(".video-list").empty();
        $(".image-list").empty();
        $(".navigation").hide();
        clickOptions();
        $(".options").hide();
        $(".g-signin2").show();
        $("#usrimg").hide();
        $("#log-out").hide();
        $(".identity-name").empty();
    });
}


