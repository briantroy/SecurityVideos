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

            jQuery.data(document.body, camera_name, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + camera_name + "-timeline' class='row video-list'" +
                    "style='margin-top 25px;'></div>");
                $("#" + camera_name + "-timeline").hide();
                thtml = "<li><a href='#' onclick='showTimeline(\"" + camera_name + "\")'>"  + camera_name + "</a></li>";

                $("ul#camera-menu").append(thtml);
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
    var vid_uri;
    videoItems.forEach(function(item) {
        if(useSmallVideo()) {
            vid_uri = item.uri_small_video;
        } else {
            vid_uri = item.uri;
        }
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row video-row'><div class='four columns'>" + item.camera_name + " at " + video_ts.toLocaleString() +
            "   </div><div class='three columns'><button type='button' onclick='playVideo(\"" + vid_uri + "\")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
    });

}

function showTimeline(scope) {
    $("#current-video").empty();
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
    clickMenu();
}

function refreshVideos(token) {
    $("#current-video").empty();
    getLatestVideos(token);
}

function playVideo(uri) {
    var thtml = "<video class='video-embed' src='" + uri + "' preload autoplay controls></video>";
    $("#current-video").empty();
    $("#current-video").append(thtml);
    $("#video-container").show();
}

function closeVideo() {
    $("#current-video").empty();
    $("#video-container").hide();
}

function clickMenu() {
    $(".hamburger").toggleClass("is-active");
    if ($("#page-nav").is(":visible")) {
        $("#page-nav").hide();
    } else {
        $("#page-nav").show();
    }
}

function useSmallVideo() {
    if(window.innerWidth < 1280 || $(".container").css("width") < 960) {
        return true;
    }
    return false;;
}