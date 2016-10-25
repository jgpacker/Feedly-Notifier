"use strict";

var popupGlobal = {
    //Determines lists of supported jQuery.timeago localizations, default localization is en
    supportedTimeAgoLocales: ["ru", "fr", "pt-br", "it", "cs", "zh-CN", "zh-TW", "tr", "es", "ko", "de", "uk", "sr", "ja", "ar", "id", "da", "nl"],
    feeds: [],
    savedFeeds: [],
    backgroundPage: chrome.extension.getBackgroundPage()
};

$(document).ready(function () {
    $("html").css("font-size", popupGlobal.backgroundPage.appGlobal.options.popupFontSize / 10 + "px");

    // toolbar
    //$("#mark-all-read>span").text(chrome.i18n.getMessage("MarkAllAsRead"));
    $("#mark-all-read").attr("title", chrome.i18n.getMessage("MarkAllAsRead"));
    //$("#update-feeds>span").text(chrome.i18n.getMessage("UpdateFeeds"));
    $("#update-feeds").attr("title", chrome.i18n.getMessage("UpdateFeeds"));
    //$("#open-all-news>span").text(chrome.i18n.getMessage("OpenAllFeeds"));
    $("#open-all-news").attr("title", chrome.i18n.getMessage("OpenAllFeeds"));
    //$("#open-unsaved-all-news>span").text(chrome.i18n.getMessage("OpenAllSavedFeeds"));
    $("#open-all-saved-news").attr("title", chrome.i18n.getMessage("OpenAllSavedFeeds"));

    if (popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds) {
        $(".popup__content .tab-container").show();
    } else {
        $(".popup__content .tab-container").hide();
    }

    setPopupExpand(false);

    //If we support this localization of timeago, then insert script with it
    if (popupGlobal.supportedTimeAgoLocales.indexOf(window.navigator.language) !== -1) {
        //Trying load localization for jQuery.timeago
        $.getScript("/scripts/timeago/locales/jquery.timeago." + window.navigator.language + ".js", function () {
            executeAsync(renderFeeds);
        });
    } else {
        executeAsync(renderFeeds);
    }
});

$("#login").click(function () {
    popupGlobal.backgroundPage.getAccessToken();
});

//using "mousedown" instead of "click" event to process middle button click.
$("#feed, #feed-saved").on("mousedown", "a", function (event) {
    var link = $(this);
    if (event.which === 1 || event.which === 2) {
        var isActiveTab = !(event.ctrlKey || event.which === 2) && !popupGlobal.backgroundPage.appGlobal.options.openFeedsInBackground;
        var isFeed = link.parent().hasClass("article__title") && $("#feed").is(":visible");
        var url = link.data("link");

        if (isFeed && popupGlobal.backgroundPage.appGlobal.feedTab && popupGlobal.backgroundPage.appGlobal.options.openFeedsInSameTab) {
            chrome.tabs.update(popupGlobal.backgroundPage.appGlobal.feedTab.id,{url: url}, function(tab) {
                onOpenCallback(isFeed, tab);
            })
        } else {
            chrome.tabs.create({url: url, active: isActiveTab }, function(tab) {
                onOpenCallback(isFeed, tab);
            });
        }
    }

    function onOpenCallback(isFeed, tab) {
        if (isFeed) {
            popupGlobal.backgroundPage.appGlobal.feedTab = tab;

            if (popupGlobal.backgroundPage.appGlobal.options.markReadOnClick) {
                markAsRead([link.closest(".article").data("id")]);
            }
        }
    }
});

/* header */
$(".header").on("click", ".header__logo", function (event) {
    if (event.ctrlKey) {
        popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds = !popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds;
        location.reload();
        e.preventDefault();
    }else{
        popupGlobal.backgroundPage.openFeedlyTab();
    }
});
$(".header").on("click", "#open-all-news", function () {
    $("#feed").find(".article__title a[data-link]").filter(":visible").each(function (key, value) {
        var news = $(value);
        chrome.tabs.create({url: news.data("link"), active: false }, function () {});
    });
    if (popupGlobal.backgroundPage.appGlobal.options.markReadOnClick) {
        markAllAsRead();
    }
});
$(".header").on("click", "#mark-all-read", markAllAsRead);
/* Manually feeds update */
$(".header").on("click", "#update-feeds", function () {

    var that = this;
    $(that).addClass('toolbar__item--state_animate');
    if ($("#feed").is(":visible")) {
        renderFeeds(true);
    } else {
        renderSavedFeeds(true);
    }
    setTimeout(function () {
        $(that).removeClass('toolbar__item--state_animate')
    }, 1000);
});
$(".header").on("click", "#open-options", function () {
    openOptions();
})
$(".header").on("click", "#open-all-saved-news", function () {
   $("#feed-saved").find(".article__title a[data-link]").filter(":visible").each(function (key, value) {
           var news = $(value);
           chrome.tabs.create({url: news.data("link"), active: false }, function () {});
       });
        markAllAsUnsaved();
});

/* article toolbar */
$(".feed").on("click", ".js-toolbar__action--save", function () {
    var $this = $(this);
    var feed = $this.closest(".article");
    var feedId = feed.data("id");
    var isSavedItem = !feed.data("is-saved");
    popupGlobal.backgroundPage.toggleSavedFeed([feedId], isSavedItem);
    feed.data("is-saved", isSavedItem);
    feed.toggleClass("article--saved");
});
$(".feed").on("click", ".js-toolbar__action--mark-as-readed", function (event) {
    var feed = $(this).closest(".article");
    markAsRead([feed.data("id")]);
});
$(".feed").on("click", ".js-toolbar__action--expand", function () {
    var $this = $(this);
    var feed = $this.closest(".article");
    var contentContainer = feed.find(".article__content");
    var feedId = feed.data("id");
    if (contentContainer.html() === "") {
        var feeds = $("#feed").is(":visible") ? popupGlobal.feeds : popupGlobal.savedFeeds;

        var template = $("#feed-content").html();
        Mustache.parse(template);
        for (var i = 0; i < feeds.length; i++) {
            if (feeds[i].id === feedId) {
                contentContainer.html(Mustache.render(template, feeds[i]));

                //For open new tab without closing popup
                contentContainer.find("a").each(function (key, value) {
                    var link = $(value);
                    link.data("link", link.attr("href"));
                    link.attr("href", "javascript:void(0)");
                });
            }
        }
    }
    contentContainer.slideToggle("fast", function () {

        $($this).toggleClass('toolbar__item--state_animated');

        if ($(".article__content").is(":visible")) {
            setPopupExpand(true);
        } else {
            setPopupExpand(false);
        }
    });
});

/* tabs */
$(".tab-container").on("click", "#tab-saved-feed", function () {
    $(this).addClass("tab--selected");
    $("#tab-feed").removeClass("tab--selected");
    renderSavedFeeds();
});
$(".tab-container").on("click", "#tab-feed", function () {
    $(this).addClass("tab--selected");
    $("#tab-saved-feed").removeClass("tab--selected");
    renderFeeds();
});

/* categories */
$(".popup").on("click", ".feed-category", function (){
    //$(".categories").find("span").removeClass("active");
    $('.feed-category').removeClass('feed-category--selected');
    var that = $(this);
    that.addClass('feed-category--selected');

    var button = $(this).addClass("active");
    var categoryId = button.data("id");
    if (categoryId) {
        $(".article").hide();
        $(".article[data-categories~='" + categoryId + "']").show();
    } else {
        $(".article").show();
    }
});

function openOptions() {

    chrome.tabs.create({ url: "options.html" });
}

function executeAsync(func) {
    setTimeout(function () {
        func();
    }, 0);
}

function renderFeeds(forceUpdate) {
    //showLoader();
    popupGlobal.backgroundPage.getFeeds(popupGlobal.backgroundPage.appGlobal.options.forceUpdateFeeds || forceUpdate, function (feeds, isLoggedIn) {
        popupGlobal.feeds = feeds;
        if (isLoggedIn === false) {
            showLogin();
        } else {
            if (feeds.length === 0) {
                showEmptyContent();
            } else {
                //var container = $("#feed").show().empty();
                var container = $(".popup__content .feed").show().empty();

                if (popupGlobal.backgroundPage.appGlobal.options.showCategories) {
                    renderCategories(container, feeds);
                }

                if (popupGlobal.backgroundPage.appGlobal.options.expandFeeds) {
                    var partials = { content: $("#feed-content").html() };
                }

                var feedsTemplate = $("#feedTemplate").html();
                Mustache.parse(feedsTemplate);
                container.append(Mustache.render(feedsTemplate, {feeds: feeds}, partials));
                container.find(".article__date").timeago();

                if (popupGlobal.backgroundPage.appGlobal.options.expandFeeds) {
                    //container.find(".show-content").click();
                    //container.find(".article").addClass('article--expanded');
                    container.find(".js-toolbar__action--expand").click();
                }

                showFeeds();
            }
        }
    });
}

function renderSavedFeeds(forceUpdate) {
    //showLoader();
    popupGlobal.backgroundPage.getSavedFeeds(popupGlobal.backgroundPage.appGlobal.options.forceUpdateFeeds || forceUpdate, function (feeds, isLoggedIn) {
        popupGlobal.savedFeeds = feeds;
        if (isLoggedIn === false) {
            showLogin();
        } else {
            if (feeds.length === 0) {
                showEmptyContent();
            } else {
                var container = $(".popup__content .feed").empty();

                if (popupGlobal.backgroundPage.appGlobal.options.expandFeeds) {
                    var partials = { content: $("#feed-content").html() };
                }

                if (popupGlobal.backgroundPage.appGlobal.options.showCategories) {
                    renderCategories(container, feeds);
                }

                var feedTemplate = $("#feedTemplate").html();
                Mustache.parse(feedTemplate);
                container.append(Mustache.render(feedTemplate, {feeds: feeds}, partials));
                container.find(".article__date").timeago();

                if (popupGlobal.backgroundPage.appGlobal.options.expandFeeds) {
                    container.find(".js-toolbar__action--expand").click();
                }

                showSavedFeeds();
            }
        }
    });
}

function markAsRead(feedIds) {
    var feedItems = $();
    for (var i = 0; i < feedIds.length; i++) {
        feedItems = feedItems.add("#feed .feed__article[data-id='" + feedIds[i] + "']");
    }

    feedItems.fadeOut("fast", function(){
        $(this).remove();
    });

    feedItems.attr("data-is-read", "true");

    //Show loader if all feeds were read
    if ($("#feed").find(".feed__article[data-is-read!='true']").size() === 0) {
        showLoader();
    }
    popupGlobal.backgroundPage.markAsRead(feedIds, function () {
        if ($("#feed").find(".feed__article[data-is-read!='true']").size() === 0) {
            renderFeeds();
        }
    });
}

function markAsUnSaved(feedIds) {
    var feedItems = $();
    for (var i = 0; i < feedIds.length; i++) {
        feedItems = feedItems.add("#feed-saved .feed__article[data-id='" + feedIds[i] + "']");
    }

    popupGlobal.backgroundPage.toggleSavedFeed(feedIds, false);

    feedItems.data("is-saved", false);
    feedItems.filter(".article--saved").removeClass("article--saved");
}

function markAllAsRead() {
    var feedIds = [];
    $("#feed .feed__article").each(function (key, value) {
        feedIds.push($(value).data("id"));
    });
    markAsRead(feedIds);
}

function markAllAsUnsaved() {
    var feedIds = [];
    $("#feed-saved .feed__article").each(function (key, value) {
        feedIds.push($(value).data("id"));
    });
    markAsUnSaved(feedIds);
}

function renderCategories(container, feeds){
    $(".categories").remove();
    var categories = getUniqueCategories(feeds);
    var template = $("#categories-template").html();
    Mustache.parse(template);
    container.append(Mustache.render(template, {categories: categories}));
}

function getUniqueCategories(feeds){
    var categories = [];
    var addedIds = [];
    feeds.forEach(function(feed){
        feed.categories.forEach(function (category) {
            if (addedIds.indexOf(category.id) === -1) {
                categories.push(category);
                addedIds.push(category.id);
            }
        });
    });
    return categories;
}

function showLoader() {
    // TODO: uncomment
    $("body").children("div").hide();
    $("#loading").show();
}

function showLogin() {
    $("body").children("div").hide();
    $("#login-btn").text(chrome.i18n.getMessage("Login"));
    $("#login").show();
}

function showEmptyContent() {
    $(".popup__content").children(".feed").hide();
    $(".popup__content #empty").show().text(chrome.i18n.getMessage("NoUnreadArticles")).show();
    $(".popup__header").show().find(".header__toolbar").hide();
}

function showFeeds() {
    if (popupGlobal.backgroundPage.appGlobal.options.resetCounterOnClick) {
        popupGlobal.backgroundPage.resetCounter();
    }

    $("body").children("div").hide();
    $(".popup").show();

    $(".popup__content").children(".feed").hide();
    $(".popup__content #feed").show();

    $(".header__toolbar").show().find(".toolbar__item").show();
    $(".header__toolbar #open-all-saved-news.toolbar__item").hide();

    $(".js-toolbar__action--mark-as-readed").attr("title", chrome.i18n.getMessage("MarkAsRead"));
    $(".js-toolbar__action--expand").attr("title", chrome.i18n.getMessage("More"));
}

function showSavedFeeds() {

    $("body").children("div").hide();
    $(".popup").show();

    $(".popup__content").children(".feed").hide();
    $(".popup__content #feed-saved").show();

    $(".header__toolbar").show().find(".toolbar__item").show();
    $(".header__toolbar #mark-all-read.toolbar__item").hide();
    $(".header__toolbar #open-all-news.toolbar__item").hide();

    $(".js-toolbar__action--mark-as-readed").hide();
    $(".js-toolbar__action--expand").attr("title", chrome.i18n.getMessage("More"));
}

function setPopupExpand(isExpand){
    if (isExpand){
        $("#feed, #feed-saved, #empty").width(popupGlobal.backgroundPage.appGlobal.options.expandedPopupWidth);
    } else {
        //$("#feed, #feed-saved").width(popupGlobal.backgroundPage.appGlobal.options.popupWidth);
        $("#feed, #feed-saved, #empty").width(popupGlobal.backgroundPage.appGlobal.options.popupWidth);
    }
}
