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
                displayLatestVideos(result.Items, 'latest', 'video-timeline');
                jQuery.data(document.body, 'latest', result.Items);
            }
        }
    });
}

function getLatestVideosbyCamera(camera_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    $.ajax({
        url: base_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            divId = camera_name + "-timeline";
            $("#" + divId).remove();
            jQuery.data(document.body, camera_name, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + divId +  "' class='row video-list'" +
                    " style='margin-top 25px;'></div>");
                if(! refresh) {
                    $("#" + camera_name + "-timeline").hide();
                    var thtml = "<li><a href='#' onclick='showTimeline(\"" + camera_name + "\")'>" + camera_name + "</a></li>";

                    $("ul#camera-menu").append(thtml);
                }
                displayLatestVideos(result.Items, camera_name, camera_name + "-timeline");
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
            $(".navigation").show();
            $(".options").show();
            getLatestVideos(user_token);
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


function displayLatestVideos(videoItems, camera,  targetDiv) {
    targetDiv = "#" + targetDiv;
    $(targetDiv).empty();
    var vid_uri;
    var idx = 0;
    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row video-row'><div class='u-pull-left video-info'>" + item.camera_name + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
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
        getLatestVideos(user_token);
        $("#video-timeline").show();

    } else {
        // Camera name
        getLatestVideosbyCamera(scope, user_token, true);

    }
    clickMenu();
}

function playVideo(camera, videoIdx) {
    var uri;
    var vidList = jQuery.data(document.body, camera);

    if($(".opt-checkbox").is(':checked')) {
        uri = vidList[videoIdx].uri;
    } else {
        uri = vidList[videoIdx].uri_small_video;
    }

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
    $("#camera-nav-menu").toggleClass("is-active");
    if ($("#page-nav").is(":visible")) {
        $("#page-nav").hide();
    } else {
        $("#page-nav").show();
    }
}

function clickOptions() {
    $("#options-menu").toggleClass("is-active");
    if ($("#page-opts").is(":visible")) {
        $("#page-opts").hide();
    } else {
        $("#page-opts").show();
    }
}

function setDefaultVideoResoloution() {
    var containerSize = parseInt($(".container").css("width"));
    if(containerSize < 960) {
        $(".opt-checkbox").prop('checked', false);
    } else {
        $(".opt-checkbox").prop('checked', true);
    }
}