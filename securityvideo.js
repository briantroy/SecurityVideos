/**
 * Created by brian.roy on 8/20/16.
 */

var video_api_host = 'https://7k8o0sgjli.execute-api.us-east-1.amazonaws.com';
var base_video_api_uri = video_api_host + '/securityvideos';
var base_image_api_uri = video_api_host + '/securityvideos/still-images';
var loadWait;

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
    request_params['num_results'] = 20

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
                        jQuery.data(document.body, data_key, result.Items);
                        if(eventType == 'image') {
                            loadLabelsForImageSet(data_key, "#" + target_div);
                        }
                        jQuery.data(document.body, 'view_scope', 'latest');
                        render_callback(result.Items, 'latest', target_div);
                    }
                });
            } else {
                jQuery.data(document.body, data_key, result.Items);
                if(eventType == 'image') {
                    loadLabelsForImageSet(data_key, "#" + target_div);
                }
                render_callback(result.Items, 'latest', target_div);
                jQuery.data(document.body, 'view_scope', 'latest');
            }
        }
    });
}

function getLatestVideosbyCamera(camera_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    var request_params = {};
    request_params['num_results'] = 20;
    jQuery.data(document.body, 'view_scope', camera_name);
    $.ajax({
        url: base_video_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

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
                loadLabelsForImageSet(data_key, "#" + divId);

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
            camlist = result;
            loadCameraVids(result, token);

            // Now load latest
            getLatest(user_token, "video", displayLatestVideos);
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
            "<img src='" + item.uri + "' title='" + img_text + "' style='width:100%; height:100%;'/></div>";
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
    $(targetDiv).off('beforeChange');
    $(targetDiv).on('beforeChange', function(event, slick, currentSlide, nextSlide){
        if (currentSlide == 1 && nextSlide == 0) {
            loadPrevImages(videoItems[0].camera_name, videoItems[0].capture_date,
                videoItems[0].event_ts, targetDiv);
        }
        if (currentSlide == 8 && nextSlide == 9) {
            var maxIdx = (videoItems.length - 1);
            loadNextImages(videoItems[maxIdx].camera_name, videoItems[maxIdx].capture_date,
                videoItems[maxIdx].event_ts, targetDiv);
        }
    });
    $(targetDiv).on('afterChange', function (event, slick, currentSlide){
        displayImageLabels(videoItems[currentSlide].object_key, targetDiv);
    });

}

function showTimeline(scope, invoked_by) {
    var types = ["image","video"];
    console.log(scope)
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
    $("#video-container").hide();
    $("#current-video").empty();
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

function loadNextImages(camera, captureDate, lastImageTS, targetDiv) {
    loadMoreImages(targetDiv, camera, captureDate, user_token, lastImageTS, "earlier");
}

function loadPrevImages(camera, captureDate, firstImageTS, targetDiv) {
    loadMoreImages(targetDiv, camera, captureDate, user_token, firstImageTS, "later");
}

function loadMoreImages(targetDiv, camera_name, captureDate, token, timestamp, direction) {
    direction = typeof direction !== 'undefined' ?  direction : "earlier";
    var request_params = {};

    if (direction == "earlier") {
        request_params['older_than_ts'] = timestamp;
    } else {
        request_params['newer_than_ts'] = timestamp;
    }
    request_params['num_results'] = 9;

    var thisURI = base_image_api_uri + '/lastfive';
    if(targetDiv !== '#image-timeline') {
        thisURI += "/" + camera_name;
    } else {
        request_params['image_date'] = captureDate;
    }
    // console.log("more with: ");
    // console.log(request_params);

    $.ajax({
        url: thisURI,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            var divId = camera_name + "-image-timeline";
            var data_key = "image-" + camera_name;
            if (direction == 'earlier') displayImagesAtEnd(result.Items, camera_name, targetDiv);
            if (direction == 'later') displayImagesAtBeginning(result.Items, camera_name, targetDiv);
        }
    });
}

function displayImagesAtEnd(items, camera, targetDiv) {
    var idx = 0;
    var currSlide = $(targetDiv).slick('slickCurrentSlide');
    var minIdx = 0;
    var data_key = "image-" + camera;
    if(targetDiv == '#image-timeline') {
        data_key = 'image-latest';
    }
    var oldItems = jQuery.data(document.body, data_key);
    var newItems = [oldItems[9]];
    items.forEach(function(item) {
        var img_ts = new Date((item.event_ts * 1000));
        var img_text = item.camera_name + " at " + img_ts.toLocaleString();
        var thtml = "<div class='row image-row' >" +
            "<img src='" + item.uri + "' title='" + img_text + "' style='width:100%; height:100%;'/></div>";
        $(targetDiv).slick('slickAdd', thtml);
        idx += 1;
        newItems[idx] = item;
    });
    items = newItems;
    // Remove images to Left.
    for(var i=(currSlide-1); i >= minIdx; i--){
        $(targetDiv).slick('slickRemove', i);
    }
    $(targetDiv).slick('slickGoTo', 0);

    // Save data for next pass
    jQuery.data(document.body, data_key, items);
    loadLabelsForImageSet(data_key);

    $(targetDiv).off('beforeChange');
    $(targetDiv).on('beforeChange', function(event, slick, currentSlide, nextSlide){
        if (currentSlide == 1 && nextSlide == 0) {
            loadPrevImages(items[0].camera_name, items[0].capture_date,
                items[0].event_ts, targetDiv);
        }
        if (currentSlide == 8 && nextSlide == 9) {
            var maxIdx = (items.length - 1);
            loadNextImages(items[maxIdx].camera_name, items[maxIdx].capture_date,
                items[maxIdx].event_ts, targetDiv);
        }
    });
    $(targetDiv).on('afterChange', function (event, slick, currentSlide){
        displayImageLabels(items[currentSlide].object_key, targetDiv);
    });
}

function displayImagesAtBeginning(items, camera, targetDiv) {
    var idx = 0;
    var i;
    var data_key = "image-" + camera;
    if(targetDiv == '#image-timeline') {
        data_key = 'image-latest';
    }
    if(items.length > 0) {
        var numNewImages = items.length;
        items.reverse();
        if(numNewImages < 10) {
            // Pad with old images so our object has 10 at all times
            var oldImages = jQuery.data(document.body, data_key);
            var numToAdd = (10 - numNewImages);
            for(i=0; i<numToAdd; i++) {
                items[(numNewImages + i)] = oldImages[i];
            }
        }

        // The items are reversed (largest event_ts in index 0) to enable the padding above.
        // We need this for rendering as well since we add at the beginning of the slick image slider (not at the
        // end like in a starting load.
        // Create a rendering copy and reverse the items for storage and future reference.

        items.reverse();

        items.forEach(function (item) {
            var img_ts = new Date((item.event_ts * 1000));
            var img_text = item.camera_name + " at " + img_ts.toLocaleString();
            var thtml = "<div class='row image-row' >" +
                "<img src='" + item.uri + "' title='" + img_text + "' style='width:100%; height:100%;'/></div>";
            $(targetDiv).slick('slickAdd', thtml, 0, 'addBefore');
            idx += 1;
        });

        $(targetDiv).slick('slickGoTo', numNewImages);

        // Save data for next pass
        jQuery.data(document.body, data_key, items.reverse());
        loadLabelsForImageSet(data_key);

        // Remove images to Right.
        for(var i=0; i < 10; i++){
            $(targetDiv).slick('slickRemove', (19 - i));
        }

        $(targetDiv).off('beforeChange');
        $(targetDiv).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            if (currentSlide == 1 && nextSlide == 0) {
                loadPrevImages(items[0].camera_name, items[0].capture_date,
                    items[0].event_ts, targetDiv);
            }
            if (currentSlide == 8 && nextSlide == 9) {
                var maxIdx = (items.length - 1);
                loadNextImages(items[maxIdx].camera_name, items[maxIdx].capture_date,
                    items[maxIdx].event_ts, targetDiv);
            }
        });
        $(targetDiv).on('afterChange', function (event, slick, currentSlide){
            displayImageLabels(items[currentSlide].object_key, targetDiv);
        });
    } else {
        // console.log('no new images...');
    }
}

function loadLabelsForImageSet (data_key, targetDiv) {
    var imageSet = jQuery.data(document.body, data_key);
    for(var i=0; i<imageSet.length; ++i) {
        getCameraImageLabels(imageSet[i].object_key);
    }
    if(typeof targetDiv != 'undefined' && (! jQuery.contains(targetDiv, "#image-labels"))) {
        displayImageLabels(imageSet[0].object_key, (targetDiv));
    }
}

function getCameraImageLabels(image_key) {
    var request_params = {};

    request_params['image-key'] = image_key;

    var thisURI = base_video_api_uri + '/image/labels';

    $.ajax({
        url: thisURI,
        crossDomain: true,
        headers: {
            "Authorization":user_token
        },
        data: request_params,

        success: function( result ) {
            jQuery.data(document.body, image_key, roundAndSortConfidenceValues(result.Items));
        }
    });
}

function roundAndSortConfidenceValues(items) {
    var tempConfidence;
    for(var i=0; i<items.length; ++i) {
        tempConfidence = items[i].confidence;
        tempConfidence = parseFloat(tempConfidence).toFixed(2);
        items[i].confidence = tempConfidence;
    }

    // Now sort by confidence decending
    items.sort(function(a, b) {
        if(parseFloat(a.confidence) > parseFloat(b.confidence)) return -1;
        if(parseFloat(a.confidence) > parseFloat(b.confidence)) return 1;
        return 0;
    });
    return items;
}

function displayImageLabels(object_key, targetDiv) {

    // Put the labels in
    var img_labels = jQuery.data(document.body, object_key);
    if(typeof img_labels !== 'undefined') {
        $("#image-labels").remove();
        var thtml = "<div id=image-labels> ";
        for(var i=0; i<img_labels.length; ++i) {
            if(i>0) thtml += ", ";
            thtml += img_labels[i].label + ": " + img_labels[i].confidence;
        }
        thtml += "</div>";
        $(targetDiv).append(thtml);
        clearTimeout(loadWait);
    } else {
        loadWait = setTimeout(displayImageLabels, 500, object_key, targetDiv);
    }
}

function loadNextVideos(camera) {
    var div_name = "#video-timeline";
    if(camera !== 'latest') {
        div_name = "#" + camera + '-video-timeline';
    }
    var data_key = 'video-' + camera;
    var video_data = jQuery.data(document.body, data_key);

    var last_video_item = video_data[video_data.length - 1];

    var lastVideoTS = last_video_item['event_ts'];
    var captureDate = last_video_item['capture_date'];

    loadMoreVideos(div_name, camera, captureDate, user_token, lastVideoTS, "earlier");
}

function loadPrevVideos(camera) {
    var div_name = "#video-timeline";
    if(camera !== 'latest') {
        div_name = "#" + camera + '-video-timeline';
    }

    var data_key = 'video-' + camera;
    var video_data = jQuery.data(document.body, data_key);

    var first_video_item = video_data[0];

    var firstVideoTS = first_video_item['event_ts'];
    var captureDate = first_video_item['capture_date'];

    loadMoreVideos(targetDiv, camera, captureDate, user_token, firstVideoTS, "later");
}

function loadMoreVideos(targetDiv, camera_name, captureDate, token, timestamp, direction) {
    direction = typeof direction !== 'undefined' ?  direction : "earlier";
    var request_params = {};
    var data_key = 'video-' + camera_name;
    var vidList = jQuery.data(document.body, data_key);

    if (direction == "earlier") {
        request_params['older_than_ts'] = timestamp;
    } else {
        request_params['newer_than_ts'] = timestamp;
    }
    request_params['num_results'] = 10;

    var thisURI = base_video_api_uri + '/lastfive';
    if(targetDiv !== '#video-timeline') {
        thisURI += "/" + camera_name;
    } else {
        request_params['video_date'] = captureDate;
    }
    // console.log("more with: ");
    // console.log(request_params);

    $.ajax({
        url: thisURI,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            var divId = camera_name + "-video-timeline";
            var data_key = "video-" + camera_name;
            if (direction == 'earlier') {
                displayVideosAtEnd(result.Items, camera_name, targetDiv, vidList.length);
                for(var i = 0; i < result.Items.length; ++i) vidList.push(result.Items[i]);
                // console.log(vidList);
                jQuery.data(document.body, data_key, vidList);
            }
            if (direction == 'later') {
                for (var i = 0; i < vidList.length; ++i) result.Items.push(vidList[i]);
                // console.log(result.Items);
                jQuery.data(document.body, data_key, result.Items);
                displayVideosAtBeginning(result.Items, camera_name, targetDiv, 0);
            }
        }
    });
}

function displayVideosAtEnd(videoItems, camera,  targetDiv, start_index) {
    targetDiv = targetDiv;
    camera = camera.replace("video-", "");
    var vid_uri;
    var idx = start_index;
    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item.camera_name + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });
    jQuery.data(document.body, 'page_request_inflight', 0);

}

function displayVideosAtBeginning(videoItems, camera,  targetDiv, start_index) {
    targetDiv = targetDiv;
    camera = camera.replace("video-", "");
    var vid_uri;
    var idx = start_index;
    $(targetDiv).empty();
    videoItems.forEach(function(item) {
        var video_ts = new Date((item.event_ts * 1000));
        var thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item.camera_name + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).prepend(thtml);
        idx += 1;
    });
    jQuery.data(document.body, 'page_request_inflight', 0);

}