/**
 * Created by brian.roy on 8/20/16.
 */

var base_api_uri = 'https://7k8o0sgjli.execute-api.us-east-1.amazonaws.com/securityvideos';

function getLatestVideos(token) {
    $.ajax({
        url: base_api_uri + "/lastfive",
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            console.log(result);
            displayLatestVideos(result.Items)
        }
    });
}

function getLatestVideosbyCamera(camera_name, token) {
    $.ajax({
        url: base_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            console.log(result);
            jQuery.data(document.body, camera_name, result)
        }
    });
}

function getCameraList(token) {
    $.ajax({
        url: base_api_uri + "/cameras",
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            console.log(result);
            jQuery.data(document.body, 'cameras', result);
            loadCameraVids(result, token);
        }
    });
}

function loadCameraVids(cameras, token) {
    cameras.forEach(function(cam) {
         getLatestVideosbyCamera(cam, token);
    });
}


function displayLatestVideos(videoItems) {
    $("#latest-videos").empty();

    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "Video for " + item.camera_name + " at " + video_ts.toLocaleString() +
            "   <button type='button' onclick='playVideo(\"" + item.uri + "\")'>Play Now</button>" +
            "   <a href='" + item.uri + "' target='_blank'>download now</a><br/>";
        $("#latest-videos").append(thtml);
    });

}

function playVideo(uri) {
    var thtml = "<video src='" + uri + "' controls autoplay></video>";
    $("#current-video").empty();
    $("#current-video").append(thtml);
}