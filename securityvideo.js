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
                displayLatestVideos(result.Items, 'video-timeline');
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
            if(result.Items.length > 0) {
                $("#latest-videos").append("<div id='" + camera_name + "-timeline'></div>");
                $("#" + camera_name + "-timeline").hide();
                $("#list-controls").append("<button type='button' onclick='showTimeline(\"" + camera_name +
                    "\")'>Show " + camera_name + "</button>");
                displayLatestVideos(result.Items, camera_name + "-timeline");
            }
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
            camlist = result;
            loadCameraVids(result, token);
        }
    });
}

function loadCameraVids(cameras, token) {
    cameras.forEach(function(cam) {
        getLatestVideosbyCamera(cam, token);
    });
}


function displayLatestVideos(videoItems, targetDiv) {
    targetDiv = "#" + targetDiv;
    $(targetDiv).empty();


    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "Video for " + item.camera_name + " at " + video_ts.toLocaleString() +
            "   <button type='button' onclick='playVideo(\"" + item.uri + "\")'>Play Now</button>" +
            "   <a href='" + item.uri + "' target='_blank'>download now</a><br/>";
        $(targetDiv).append(thtml);
    });

}

function showTimeline(scope) {
    // Start by hiding all the camera divs
    $("#video-timeline").hide();
    var divname = "";
    camlist.forEach(function(camera) {
        divname = "#" + camera + "-timeline";
        $(divname).hide();
    });

    if(scope =='latest') {
        $("#video-timeline").show();

    } else {
        // Camera name
        divname = "#" + scope + "-timeline";
        $(divname).show();
    }
}

function refreshVideos(token) {
    $("#current-video").empty();
    getLatestVideos(token);
}

function playVideo(uri) {
    var thtml = "<video src='" + uri + "' controls autoplay></video>";
    $("#current-video").empty();
    $("#current-video").append(thtml);
}