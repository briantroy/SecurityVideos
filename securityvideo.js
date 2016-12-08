/**
 * Created by brian.roy on 8/20/16.
 */

var video_api_host = 'https://7k8o0sgjli.execute-api.us-east-1.amazonaws.com';
var base_video_api_uri = video_api_host + '/securityvideos';
var base_image_api_uri = video_api_host + '/securityvideos/still-images';

function getLatest(token, eventType, render_callback) {
    var dateObj = new Date();
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var year = dateObj.getFullYear();
    if(month < 10) month = "0" + month;
    if(day < 10) day = "0" + day;
    var datestring = year + "-" + month + "-" + day;
    var base_uri = base_video_api_uri;
    var date_param = 'video_date';
    var target_div = 'video-timeline';
    if(eventType == 'image') {
        base_uri = base_image_api_uri;
        date_param = 'image_date';
        target_div = 'image-timeline';
    }
    var data_key = eventType + '-latest';

    var request_params = {};
    request_params[date_param] = datestring;

    $.ajax({
        url: base_uri + "/lastfive",
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {

            if(result.Items.length == 0) {
                // Previous Date
                day = day - 1;
                datestring = year + "-" + month + "-" + day;
                request_params[date_param] = datestring;
                $.ajax({
                    url: base_uri + "/lastfive",
                    crossDomain: true,
                    headers: {
                        "Authorization":token
                    },
                    data: request_params,

                    success: function( result ) {

                        render_callback(result.Items, 'latest', target_div);
                        jQuery.data(document.body, data_key, result.Items);
                    }
                });
            } else {
                render_callback(result.Items, 'latest', target_div);
                jQuery.data(document.body, data_key, result.Items);
            }
        }
    });
}

function getLatestVideosbyCamera(camera_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    $.ajax({
        url: base_video_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            var divId = camera_name + "-video-timeline";
            var data_key = "video-" + camera_name;
            $("#" + divId).remove();
            jQuery.data(document.body, data_key, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + divId +  "' class='row video-list'" +
                    " style='margin-top 25px;'></div>");
                if(! refresh) {
                    $("#" + divId).hide();
                    var thtml = "<li " +
                        " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"" +
                        "><a href='#' onclick='showTimeline(\"" + camera_name + "\")'>" + camera_name + "</a></li>";

                    $("ul#camera-menu").append(thtml);
                }
                displayLatestVideos(result.Items, camera_name, divId);
            }
        }
    });
}

function getLatestImagesbyCamera(camera_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    $.ajax({
        url: base_image_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            var divId = camera_name + "-image-timeline";
            var data_key = "image-" + camera_name;
            $("#" + divId).remove();
            jQuery.data(document.body, data_key, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + divId +  "' class='row image-list'" +
                    " style='margin-top 25px;'></div>");

                displayLatestImagesCarousel(result.Items, camera_name, divId);
            }
        }
    });
}

function getCameraList(token) {
    $.ajax({
        url: base_video_api_uri + "/cameras",
        crossDomain: true,
        headers: {
            "Authorization":token
        },

        success: function( result ) {
            $(".navigation").show();
            $(".options").show();
            getLatest(user_token, "video", displayLatestVideos);
            // getLatest(user_token, "image", displayLatestImages);
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
    camera = camera.replace("video-", "");
    $(targetDiv).empty();
    var vid_uri;
    var idx = 0;
    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item.camera_name + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });

}

function displayLatestImages(videoItems, camera,  targetDiv) {
    targetDiv = "#" + targetDiv;
    camera = camera.replace("video-", "");
    $(targetDiv).empty();
    var idx = 0;
    videoItems.forEach(function(item) {
        var img_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row image-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item.camera_name + " at " + img_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><img width='150px' src='" + item.uri + "' onclick='displayImage(\"" + camera + "\", "  + idx + ")' /></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });
    $(targetDiv).show();

}

function displayLatestImagesCarousel(videoItems, camera, targetDiv) {
    $('#' + targetDiv).remove();
    $(".container").append("<div id='" + targetDiv +  "' class='row image-list'" +
        " style='margin-top 25px;'></div>");
    targetDiv = "#" + targetDiv;
    var idx = 0;
    videoItems.forEach(function(item) {
        var img_ts = new Date((item.event_ts * 1000));
        var img_text = item.camera_name + " at " + img_ts.toLocaleString();
        var thtml = "<div class='row image-row' >" +
            "<img src='" + item.uri + "' text='" + img_text + "' style='width:100%; height:100%;'/></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });
    $(targetDiv).show();

    $(targetDiv).slick({
        dots: true,
        infinite: false,
        speed: 500,
        fade: true,
        cssEase: 'linear',
        mobileFirst: true
    });
    $(targetDiv).on('beforeChange', function(event, slick, currentSlide, nextSlide){
        if (currentSlide == 1 && nextSlide == 0) {
            console.log("Load Previous 10");
        }
        if (currentSlide == 8 && nextSlide == 9) {
            console.log("Load Next 10");
        }
    });

}

function showTimeline(scope, invoked_by) {
    var types = ["image","video"];
    $("#current-video").empty();
    $("#current-image").empty();
    if ($("#show-images-opt").is(':checked')) {
        type = 'image';
    } else {
        type = 'video';
    }
    // Start by hiding all the camera & image divs
    var divname = "";
    for (var i = 0; i < types.length; ++i) {
        temp_type = types[i];
        $("#" + temp_type + "-timeline").hide();
        camlist.forEach(function (camera) {
            divname = "#" + camera + "-" + temp_type + "-timeline";
            $(divname).hide();
        });
    }

    if(scope =='latest') {
        if (type == "video") {
            getLatest(user_token, type, displayLatestVideos);
            $("#video-timeline").show();
            $("#image-timeline").hide();
        }
        if (type == "image") {
            getLatest(user_token, type, displayLatestImagesCarousel);
            $("#video-timeline").hide();
            $("#image-timeline").show();
        }

    } else {
        if (type == 'video') {
            // Camera name
            getLatestVideosbyCamera(scope, user_token, true);
        }
        if (type == 'image') {
            getLatestImagesbyCamera(scope, user_token, false);
        }

    }
    if (invoked_by !== 'options') clickMenu();
}

function playVideo(camera, videoIdx) {
    var uri;
    var data_key = 'video-' + camera;
    var vidList = jQuery.data(document.body, data_key);

    if($("#full-res-videos").is(':checked')) {
        uri = vidList[videoIdx].uri;
    } else {
        uri = vidList[videoIdx].uri_small_video;
    }

    var thtml = "<video class='video-embed' src='" + uri + "' preload autoplay controls></video>";
    $("#current-video").empty();
    $("#current-video").append(thtml);
    $("#video-container").show();
}

function displayImage(camera, imageIdx) {
    var data_key = 'image-' + camera;
    var imgList = jQuery.data(document.body, data_key);
    var uri = imgList[imageIdx].uri;


    var thtml = "<img class='image-embed' src='" + uri + "'/>";
    $("#current-image").empty();
    $("#current-image").append(thtml);
    $("#image-container").show();
}

function closeVideo() {
    $("#current-video").empty();
    $("#video-container").hide();
}

function closeImage() {
    $("#current-image").empty();
    $("#image-container").hide();
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
        $("#full-res-videos").prop('checked', false);
    } else {
        $("#full-res-videos").prop('checked', true);
    }
}