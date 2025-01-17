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
    $("#video-container").css('visibility', 'hidden');
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
    });
    $("#close-video").click(function() {
        closeVideo();
    });
    $(window).scroll(function () {
        if (($(document).height()) <= $(window).scrollTop() + $(window).height()) {
            // console.log("End Of The Page for: " + jQuery.data(document.body, 'view_scope'));
            if (jQuery.data(document.body, 'page_request_inflight') === 0) {
                jQuery.data(document.body, 'page_request_inflight', 1);
                loadNextVideos(jQuery.data(document.body, 'view_scope'));
            }
        }
    });

    var script = document.querySelector('#gid');
    window.onGoogleLibrrayLoad = function() {
        google.accounts.id.initialize({ 
            client_id: '522648161569-735fsdpk8vf40tl854ktv0kg9629hn8d.apps.googleusercontent.com', 
            callback: onSignIn, 
            auto_prompt: true,
            allowed_parent_origin: "https://security-videos.brianandkelly.ws, https://sec-vid-dev.brianandkelly.ws, http://localhost:5500",
            state_cookie_domain: 'brianandkelly.ws'
        });
        
        google.accounts.id.prompt();
    };
    

});

function onSignIn(googleUser) {
    // console.log(googleUser);
    const responsePayload = decodeJwtResponse(googleUser.credential)
    
    // console.log(responsePayload);

    user_token = googleUser.credential;
    // console.log(user_token);

    document.getElementById('usrimg').src=responsePayload.picture;
    $(".identity-name").append(responsePayload.name + "<br/>" + responsePayload.email);
    jQuery.data(document.body, 'authData', googleUser);
    $("#usrimg").show();
    $("#log-out").show();
    $(".g_id_signin").hide();
    $(".options").show();
    getCameraList(user_token);

}

function signOut() {
    google.accounts.id.disableAutoSelect();
    location.reload();
    
}
function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}


