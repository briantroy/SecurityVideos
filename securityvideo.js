/**
 * Created by brian.roy on 8/20/16.
 */

const video_api_host = 'https://api.security-videos.brianandkelly.ws';
const base_video_api_uri = video_api_host + '';
const base_image_api_uri = video_api_host + '/still-images';
var loadWait;

function getLatest(token, eventType, render_callback) {
    let dateObj = new Date();
    let month = dateObj.getMonth() + 1;
    let day = dateObj.getDate();
    let year = dateObj.getFullYear();
    if(month < 10) month = "0" + month;
    if(day < 10) day = "0" + day;
    let datestring = year + "-" + month + "-" + day;
    let base_uri = base_video_api_uri;
    let date_param = 'video_date';
    let target_div = 'video-timeline';
    let request_params = {};
    request_params['num_results'] = 20;
    if(eventType === 'image') {
        base_uri = base_image_api_uri;
        date_param = 'image_date';
        target_div = 'image-timeline';
        request_params['num_results'] = 10;
    }
    request_params[date_param] = datestring;
    let data_key = eventType + '-latest';

    $.ajax({
        url: base_uri + "/lastfive",
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {

            if(result.Items.length === 0) {
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
                        if(eventType === 'image') {
                            loadLabelsForImageSet(data_key, "#" + target_div);
                        }
                        jQuery.data(document.body, 'view_scope', 'latest');
                        jQuery.data(document.body, 'is_filter', false)
                        render_callback(result.Items, 'latest', target_div);
                    }
                });
            } else {
                jQuery.data(document.body, data_key, result.Items);
                if(eventType === 'image') {
                    loadLabelsForImageSet(data_key, "#" + target_div);
                }
                render_callback(result.Items, 'latest', target_div);
                jQuery.data(document.body, 'view_scope', 'latest');
                jQuery.data(document.body, 'is_filter', false)
            }
        }
    });
}

function getLatestVideosbyCamera(camera_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    let request_params = {};
    request_params['num_results'] = 20;
    jQuery.data(document.body, 'view_scope', camera_name);
    jQuery.data(document.body, 'is_filter', false)
    $.ajax({
        url: base_video_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            let divId = camera_name + "-video-timeline";
            let data_key = "video-" + camera_name;
            $("#" + divId).remove();
            jQuery.data(document.body, data_key, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + divId +  "' class='row video-list'" +
                    " style='margin-top 25px;'></div>");
                if(! refresh) {
                    $("#" + divId).hide();
                    let thtml = "<li " +
                        " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"" +
                        "><a href='#' onclick='showTimeline(\"" + camera_name + "\")'>" + camera_name + "</a></li>";

                    $("ul#camera-menu").append(thtml);
                }
                displayLatestVideos(result.Items, camera_name, divId);
            }
        }
    });
}

function getLatestVideosbyFilter(filter_name, token, refresh) {
    refresh = typeof refresh !== 'undefined' ?  refresh : false;
    let request_params = {};
    request_params['filter'] = filter_name;
    jQuery.data(document.body, 'view_scope', filter_name);
    jQuery.data(document.body, 'is_filter', true)
    $.ajax({
        url: base_video_api_uri + "/lastfive",
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            let divId = "filtered-set" + "-video-timeline";
            let data_key = "video-" + filter_name;
            $("#" + divId).remove();
            jQuery.data(document.body, data_key, result.Items);
            if(result.Items.length > 0) {
                $(".container").append("<div id='" + divId +  "' class='row video-list'" +
                    " style='margin-top 25px;'></div>");
                if(! refresh) {
                    $("#" + divId).hide();
                    let thtml = "<li " +
                        " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"" +
                        "><a href='#' onclick='showTimeline(\"" + filter_name + "\")'>" + filter_name + "</a></li>";

                    $("ul#filter-menu").append(thtml);
                }
                displayLatestVideos(result.Items, filter_name, divId);
            }
        }
    });
}

function getLatestImagesbyCamera(camera_name, token, refresh) {
    // refresh = typeof refresh !== 'undefined' ?  refresh : false;
    let request_params = {};
    request_params['num_results'] = 10;
    $.ajax({
        url: base_image_api_uri + "/lastfive/" + camera_name,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            let divId = camera_name + "-image-timeline";
            let data_key = "image-" + camera_name;
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
            camlist = result['cameras'];
            filterlist = result['filters'];

            // loadCameraVids(result, token);
            console.log("New version")
            console.log(result);

            Object.keys(filterlist).forEach(function(filter) {
                thtml = "<li " +
                    " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"" +
                    "><a href='#' onclick='showTimeline(\"filter:" + filter + "\")'>Filter: " + filter + "</a></li>";

                $("ul#filter-menu").append(thtml);
            })
            
            camlist.forEach(function(camera_name, idx) {
                thtml = "<li " +
                        " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"" +
                        "><a href='#' onclick='showTimeline(\"" + camera_name + "\")'>Camera: " + camera_name + "</a></li>";

                $("ul#camera-menu").append(thtml);
            })

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
    let idx = 0;
    videoItems.forEach(function(item) {
        let video_ts = new Date((item['event_ts']));
        if(video_ts.getFullYear() < 2000) {
            video_ts = new Date((item['event_ts'] * 1000));
        }
        let thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item['camera_name'] + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });

}

function displayLatestImages(videoItems, camera,  targetDiv) {
    targetDiv = "#" + targetDiv;
    camera = camera.replace("video-", "");
    $(targetDiv).empty();
    let idx = 0;
    videoItems.forEach(function(item) {
        let img_ts = new Date((item['event_ts']));
        if(img_ts.getFullYear() < 2000) {
            img_ts = new Date((item['event_ts'] * 1000));
        }
        let thtml = "<div class='row image-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item['camera_name'] + " at " + img_ts.toLocaleString() +
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
    let idx = 0;
    videoItems.forEach(function(item) {
        let img_ts = new Date((item['event_ts']));
        if(img_ts.getFullYear() < 2000) {
            img_ts = new Date((item['event_ts'] * 1000));
        }
        let img_text = item['camera_name'] + " at " + img_ts.toLocaleString();
        let thtml = "<div class='row image-row' >" +
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
        if (currentSlide === 1 && nextSlide === 0) {
            loadPrevImages(videoItems[0]['camera_name'], videoItems[0]['capture_date'],
                videoItems[0]['event_ts'], targetDiv);
        }
        if (currentSlide === 8 && nextSlide === 9) {
            let maxIdx = (videoItems.length - 1);
            loadNextImages(videoItems[maxIdx]['camera_name'], videoItems[maxIdx]['capture_date'],
                videoItems[maxIdx]['event_ts'], targetDiv);
        }
    });
    $(targetDiv).on('afterChange', function (event, slick, currentSlide){
        displayImageLabels(videoItems[currentSlide]['object_key'], targetDiv);
    });

}

function showTimeline(scope, invoked_by) {
    let types = ["image","video"];
    type = types[0];
    console.log(scope);
    $("#current-video").empty();
    $("#current-image").empty();
    if ($("#show-images-opt").is(':checked')) {
        type = 'image';
    } else {
        type = 'video';
    }
    // Start by hiding all the camera & image divs
    let divname = "";
    let temp_type = "";
    for (let i = 0; i < types.length; ++i) {
        temp_type = types[i];
        $("#" + temp_type + "-timeline").hide();
        camlist.forEach(function (camera) {
            divname = "#" + camera + "-" + temp_type + "-timeline";
            $(divname).hide();
        });
    }

    if(scope ==='latest') {
        if (type === "video") {
            getLatest(user_token, type, displayLatestVideos);
            $("#video-timeline").show();
            $("#image-timeline").hide();
        }
        if (type === "image") {
            getLatest(user_token, type, displayLatestImagesCarousel);
            $("#video-timeline").hide();
            $("#image-timeline").show();
        }

    } else if(scope.startsWith('filter:')){
       filter_name = scope.replace('filter:', '');
        if (type === 'video') {
            getLatestVideosbyFilter(filter_name, user_token, true);
        }
        if (type === 'image') {
            getLatestImagesbyCamera(filter_name, user_token, true);
        }
    
    } else {
        if (type === 'video') {
            // Camera name
            getLatestVideosbyCamera(scope, user_token, true);
        }
        if (type === 'image') {
            getLatestImagesbyCamera(scope, user_token, false);
        }

    }
    if (invoked_by !== 'options') clickMenu();
}

function playVideo(camera, videoIdx) {
    let uri;
    let data_key = 'video-' + camera;
    let vidList = jQuery.data(document.body, data_key);

    if($("#full-res-videos").is(':checked')) {
        uri = vidList[videoIdx].uri;
    } else {
        uri = vidList[videoIdx]['uri_small_video'];
    }

    let thtml = "<video class='video-embed' src='" + uri + "' preload autoplay controls></video>";
    $("#current-video").empty();
    $("#current-video").append(thtml);
    $("#video-container").css('visibility', 'visible');
}

function displayImage(camera, imageIdx) {
    let data_key = 'image-' + camera;
    let imgList = jQuery.data(document.body, data_key);
    let uri = imgList[imageIdx].uri;


    let thtml = "<img class='image-embed' src='" + uri + "'/>";
    $("#current-image").empty();
    $("#current-image").append(thtml);
    $("#image-container").show();
}

function closeVideo() {
    $("#video-container").css('visibility', 'hidden');
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
    let containerSize = parseInt($(".container").css("width"));
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
    let request_params = {};

    if (direction === "earlier") {
        request_params['older_than_ts'] = timestamp;
    } else {
        request_params['newer_than_ts'] = timestamp;
    }
    request_params['num_results'] = 9;
    console.log(targetDiv);
    let thisURI = base_image_api_uri + '/lastfive';
    if(targetDiv !== '#image-timeline') {
        if(targetDiv.startsWith('#filtered-set'))  {
            request_params['filter'] = camera_name;
        } else {
            thisURI += "/" + camera_name;
        }
    } else {
        request_params['image_date'] = captureDate;
    }
    console.log("more with: ");
    console.log(request_params);

    $.ajax({
        url: thisURI,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            if (direction === 'earlier') displayImagesAtEnd(result.Items, camera_name, targetDiv);
            if (direction === 'later') displayImagesAtBeginning(result.Items, camera_name, targetDiv);
        }
    });
}

function displayImagesAtEnd(items, camera, targetDiv) {
    let idx = 0;
    let currSlide = $(targetDiv).slick('slickCurrentSlide');
    let minIdx = 0;
    let data_key = "image-" + camera;
    if(targetDiv === '#image-timeline') {
        data_key = 'image-latest';
    }
    let oldItems = jQuery.data(document.body, data_key);
    let newItems = [oldItems[9]];
    items.forEach(function(item) {
        let img_ts = new Date((item['event_ts']));
        if(img_ts.getFullYear() < 2000) {
            img_ts = new Date((item['event_ts'] * 1000));
        }
        let img_text = item['camera_name'] + " at " + img_ts.toLocaleString();
        let thtml = "<div class='row image-row' >" +
            "<img src='" + item.uri + "' title='" + img_text + "' style='width:100%; height:100%;'/></div>";
        $(targetDiv).slick('slickAdd', thtml);
        idx += 1;
        newItems[idx] = item;
    });
    items = newItems;
    // Remove images to Left.
    for(let i=(currSlide-1); i >= minIdx; i--){
        $(targetDiv).slick('slickRemove', i);
    }
    $(targetDiv).slick('slickGoTo', 0);

    // Save data for next pass
    jQuery.data(document.body, data_key, items);
    loadLabelsForImageSet(data_key);

    $(targetDiv).off('beforeChange');
    $(targetDiv).on('beforeChange', function(event, slick, currentSlide, nextSlide){
        if (currentSlide === 1 && nextSlide === 0) {
            loadPrevImages(items[0]['camera_name'], items[0]['capture_date'],
                items[0]['event_ts'], targetDiv);
        }
        if (currentSlide === 8 && nextSlide === 9) {
            let maxIdx = (items.length - 1);
            loadNextImages(items[maxIdx]['camera_name'], items[maxIdx]['capture_date'],
                items[maxIdx]['event_ts'], targetDiv);
        }
    });
    $(targetDiv).on('afterChange', function (event, slick, currentSlide){
        displayImageLabels(items[currentSlide]['object_key'], targetDiv);
    });
}

function displayImagesAtBeginning(items, camera, targetDiv) {
    let idx = 0;
    let i;
    let data_key = "image-" + camera;
    if(targetDiv === '#image-timeline') {
        data_key = 'image-latest';
    }
    if(items.length > 0) {
        let numNewImages = items.length;
        items.reverse();
        if(numNewImages < 10) {
            // Pad with old images so our object has 10 at all times
            let oldImages = jQuery.data(document.body, data_key);
            let numToAdd = (10 - numNewImages);
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
            let img_ts = new Date((item['event_ts']));
            if(img_ts.getFullYear() < 2000) {
                img_ts = new Date((item['event_ts'] * 1000));
            }
            let img_text = item['camera_name'] + " at " + img_ts.toLocaleString();
            let thtml = "<div class='row image-row' >" +
                "<img src='" + item.uri + "' title='" + img_text + "' style='width:100%; height:100%;'/></div>";
            $(targetDiv).slick('slickAdd', thtml, 0, 'addBefore');
            idx += 1;
        });

        $(targetDiv).slick('slickGoTo', numNewImages);

        // Save data for next pass
        jQuery.data(document.body, data_key, items.reverse());
        loadLabelsForImageSet(data_key);

        // Remove images to Right.
        for(let i=0; i < 10; i++){
            $(targetDiv).slick('slickRemove', (19 - i));
        }

        $(targetDiv).off('beforeChange');
        $(targetDiv).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            if (currentSlide === 1 && nextSlide === 0) {
                loadPrevImages(items[0]['camera_name'], items[0]['capture_date'],
                    items[0]['event_ts'], targetDiv);
            }
            if (currentSlide === 8 && nextSlide === 9) {
                let maxIdx = (items.length - 1);
                loadNextImages(items[maxIdx]['camera_name'], items[maxIdx]['capture_date'],
                    items[maxIdx]['event_ts'], targetDiv);
            }
        });
        $(targetDiv).on('afterChange', function (event, slick, currentSlide){
            displayImageLabels(items[currentSlide]['object_key'], targetDiv);
        });
    } else {
        // console.log('no new images...');
    }
}

function loadLabelsForImageSet (data_key, targetDiv) {
    let imageSet = jQuery.data(document.body, data_key);
    for(let i=0; i<imageSet.length; ++i) {
        getCameraImageLabels(imageSet[i]['object_key']);
    }
    if(typeof targetDiv != 'undefined' && (! jQuery.contains(targetDiv, "#image-labels"))) {
        displayImageLabels(imageSet[0]['object_key'], (targetDiv));
    }
}

function getCameraImageLabels(image_key) {
    let request_params = {};

    request_params['image-key'] = image_key;

    let thisURI = base_video_api_uri + '/image/labels';

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
    let tempConfidence;
    for(let i=0; i<items.length; ++i) {
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
    let img_labels = jQuery.data(document.body, object_key);
    if(typeof img_labels !== 'undefined') {
        $("#image-labels").remove();
        let thtml = "<div id=image-labels> ";
        for(let i=0; i<img_labels.length; ++i) {
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
    let div_name = "#video-timeline";
    if(camera !== 'latest') {
        div_name = "#" + camera + '-video-timeline';
    }
    console.log(camera);
    let data_key = 'video-' + camera;
    let video_data = jQuery.data(document.body, data_key);
    let is_filter = jQuery.data(document.body, 'is_filter');
    if(is_filter) {
        div_name = '#filtered-set-video-timeline';
    }


    let last_video_item = video_data[video_data.length - 1];

    let lastVideoTS = last_video_item['event_ts'];
    let captureDate = dateFromTS(lastVideoTS);
    if (jQuery.data(document.body, 'videos_in_last_request') === 0) {
        // Got nothing last time... need to go back one day in time.
        captureDate = dateFromTS(lastVideoTS - (60 * 60 * 24 * 1000));
    }

    loadMoreVideos(div_name, camera, captureDate['date'], user_token, lastVideoTS, "earlier");
}

function dateFromTS(ts) {
    let video_ts = new Date(ts);
    if(video_ts.getFullYear() < 2000) {
        video_ts = new Date(ts * 1000);
    }
    let output = {month_raw: video_ts.getMonth() + 1};
    output['day_raw'] = video_ts.getDate();
    output ['year'] = video_ts.getFullYear();

    if(output['month_raw'] < 10) {
        output['month'] = "0" + output['month_raw']
    } else {
        output['month'] = output['month_raw'];
    }
    if(output['day_raw'] < 10) {
        output['day'] = "0" + output['day_raw'];
    } else {
        output['day'] = output['day_raw'];
    }
    output['date'] = output['year'] + "-" + output['month'] + "-" + output['day'];
    return output;
}

function loadPrevVideos(camera) {
    let div_name = "#video-timeline";
    if(camera !== 'latest') {
        div_name = "#" + camera + '-video-timeline';
    }

    let data_key = 'video-' + camera;
    let video_data = jQuery.data(document.body, data_key);

    let first_video_item = video_data[0];

    let firstVideoTS = first_video_item['event_ts'];
    let captureDate = dateFromTS(firstVideoTS);

    loadMoreVideos(div_name, camera, captureDate['date'], user_token, firstVideoTS, "later");
}

function loadMoreVideos(targetDiv, camera_name, captureDate, token, timestamp, direction) {
    direction = typeof direction !== 'undefined' ?  direction : "earlier";
    let request_params = {};
    let data_key = 'video-' + camera_name;
    let vidList = jQuery.data(document.body, data_key);

    if (direction === "earlier") {
        request_params['older_than_ts'] = timestamp;
    } else {
        request_params['newer_than_ts'] = timestamp;
    }
    

    let thisURI = base_video_api_uri + '/lastfive';
    if(jQuery.data(document.body, 'is_filter')) {
        request_params['filter'] = camera_name;
        request_params['num_results'] = 200;
    } else {
        if(targetDiv !== '#video-timeline') {
            thisURI += "/" + camera_name;
            request_params['num_results'] = 10;
        } else {
            request_params['video_date'] = captureDate;
            request_params['num_results'] = 10;
        }
    }
    console.log("more with: ");
    console.log(request_params);

    $.ajax({
        url: thisURI,
        crossDomain: true,
        headers: {
            "Authorization":token
        },
        data: request_params,

        success: function( result ) {
            let data_key = "video-" + camera_name;
            jQuery.data(document.body, 'videos_in_last_request', result.Items.length);
            if (direction === 'earlier') {
                displayVideosAtEnd(result.Items, camera_name, targetDiv, vidList.length);
                for(let i = 0; i < result.Items.length; ++i) vidList.push(result.Items[i]);
                // console.log(vidList);
                jQuery.data(document.body, data_key, vidList);
            }
            if (direction === 'later') {
                for (let i = 0; i < vidList.length; ++i) result.Items.push(vidList[i]);
                // console.log(result.Items);
                jQuery.data(document.body, data_key, result.Items);
                displayVideosAtBeginning(result.Items, camera_name, targetDiv, 0);
            }
        }
    });
}

function displayVideosAtEnd(videoItems, camera,  targetDiv, start_index) {
    camera = camera.replace("video-", "");
    let idx = start_index;
    videoItems.forEach(function(item) {
        let video_ts = new Date((item['event_ts']));
        if(video_ts.getFullYear() < 2000) {
            video_ts = new Date((item['event_ts'] * 1000));
        }
        let thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item['camera_name'] + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).append(thtml);
        idx += 1;
    });
    jQuery.data(document.body, 'page_request_inflight', 0);

}

function displayVideosAtBeginning(videoItems, camera,  targetDiv, start_index) {
    camera = camera.replace("video-", "");
    let idx = start_index;
    $(targetDiv).empty();
    videoItems.forEach(function(item) {
        let video_ts = new Date((item['event_ts']));
        if(video_ts.getFullYear() < 2000) {
            video_ts = new Date((item['event_ts'] * 1000));
        }
        let thtml = "<div class='row video-row' " +
            " onmouseover=\"this.style.background='aliceblue';\" onmouseout=\"this.style.background='white'\"><div class='u-pull-left video-info'>" +
            item['camera_name'] + " at " + video_ts.toLocaleString() +
            "   </div><div class='u-pull-right'><button type='button' onclick='playVideo(\"" + camera + "\", "  + idx + ")'>Play Now</button></div></div>";
        $(targetDiv).prepend(thtml);
        idx += 1;
    });
    jQuery.data(document.body, 'page_request_inflight', 0);

}