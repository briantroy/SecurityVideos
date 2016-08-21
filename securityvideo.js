/**
 * Created by brian.roy on 8/20/16.
 */

var base_api_uri = 'https://7k8o0sgjli.execute-api.us-east-1.amazonaws.com/securityvideos';

function getLatestVideos(token) {
    var dateObj = new Date();
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var year = dateObj.getFullYear();
    if(month < 10) month = "0" + month;
    if(day < 10) day = "0" + day;
    var datestring = year + "-" + month + "-" + day;

    $.ajax({
        url: base_api_uri + "/lastfive",
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: {
            "video_date" : datestring
        },

        success: function( result ) {
            console.log(result);
            if(result.Items.length == 0) {
                // Previous Date
                day = day - 1;
                datestring = year + "-" + month + "-" + day;
                $.ajax({
                    url: base_api_uri + "/lastfive",
                    crossDomain: true,
                    headers: {
                        "Authorization":token
                    },
                    data: {
                        "video_date" : datestring
                    },

                    success: function( result ) {
                        console.log(result);
                        displayLatestVideos(result.Items);
                        jQuery.data(document.body, 'latest', result.Items);
                    }
                });
            } else {
                displayLatestVideos(result.Items);
                jQuery.data(document.body, 'latest', result.Items);
            }
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
            jQuery.data(document.body, camera_name, result.Items);
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
            jQuery.data(document.body, 'cameras', result.Items);
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