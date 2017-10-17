"use strict";

import * as $ from 'jquery';

import { FeedlyCategory } from './feedly';
import { ExtensionBackgroundPage } from './background';

var optionsGlobal = {
    backgroundPermission: {
        permissions: ["background"]
    },
    allSitesPermission: {
        origins: ["<all_urls>"]
    },
    background: (<any>chrome.extension.getBackgroundPage()).ExtensionBackgroundPage
};

$(document).ready(function () {
    loadOptions();
    loadUserCategories();
    loadProfileData();
});

$("body").on("click", "#save", function (e) {
    let form = (<HTMLFormElement>document.getElementById("options"));
    if (form.checkValidity()) {
        e.preventDefault();
        saveOptions();
    }
});

$("body").on("click", "#logout", function () {
    optionsGlobal.background.logout().then(function () {
        $("#userInfo, #filters-settings").hide();
    });
});

$("#options").on("change", "input", function () {
    $("[data-disable-parent]").each(function (key, value) {
        var child = $(value);
        var parent = $("input[data-option-name='" + child.data("disable-parent") + "']");
        parent.is(":checked") ? child.attr("disabled", "disable") : child.removeAttr("disabled");
    });

    $("[data-enable-parent]").each(function (key, value) {
        var child = $(value);
        var parent = $("input[data-option-name='" + child.data("enable-parent") + "']");
        !parent.is(":checked") ? child.attr("disabled", "disable") : child.removeAttr("disabled");
    });
});

function loadProfileData() {
    optionsGlobal.background.getUserInfo().then(function (result: any) {
        var userInfo = $("#userInfo");
        userInfo.find("[data-locale-value]").each(function () {
            var textBox = $(this);
            var localValue = textBox.data("locale-value");
            textBox.text(chrome.i18n.getMessage(localValue));
        });
        userInfo.show();
        for (var profileData in result) {
            userInfo.find("span[data-value-name='" + profileData + "']").text(result[profileData]);
        }
    }, function () {
        $("#userInfo, #filters-settings").hide();
    });
}

function loadUserCategories() {
    optionsGlobal.background.getUserCategories()
        .then(function (result: FeedlyCategory[]) {
            result.forEach(function (element) {
                appendCategory(element.id, element.label);
            });
            appendCategory(optionsGlobal.background.appGlobal.globalUncategorized, "Uncategorized");
            optionsGlobal.background.appGlobal.syncStorage.get("filters", function (items: any) {
                let filters = items.filters || [];
                filters.forEach(function (id: string) {
                    $("#categories").find("input[data-id='" + id + "']").attr("checked", "checked");
                });
            });
        });
}

function appendCategory(id: string, label: string) {

    var categories = $("#categories");
    var $label = $("<label for='" + id + "' class='label' />").text(label);
    var $checkbox = $("<input id='" + id + "' type='checkbox' />").attr("data-id", id);
    categories.append($label);
    categories.append($checkbox);
    categories.append("<br/>");
}

function parseFilters() {
    var filters: string[] = [];
    $("#categories").find("input[type='checkbox']:checked").each(function (key, value) {
        var checkbox = $(value);
        filters.push(checkbox.data("id"));
    });
    return filters;
}

/* Save all option in the chrome storage */
function saveOptions() {
    var options: { [key: string]: any } = {};
    $("#options").find("input[data-option-name]").each(function (optionName, value) {
        var optionControl = $(value);
        var optionValue;
        if (optionControl.attr("type") === "checkbox") {
            optionValue = optionControl.is(":checked");
        } else if (optionControl.attr("type") === "number") {
            optionValue = Number(optionControl.val());
        } else {
            optionValue = optionControl.val();
        }
        options[optionControl.data("option-name")] = optionValue;
    });
    options.filters = parseFilters();

    // @if BROWSER=='chrome'
    setBackgroundMode($("#enable-background-mode").is(":checked"));
    // @endif

    setAllSitesPermission($("#showBlogIconInNotifications").is(":checked")
        || $("#showThumbnailInNotifications").is(":checked"), options, function () {
            optionsGlobal.background.appGlobal.syncStorage.set(options, function () {
                alert(chrome.i18n.getMessage("OptionsSaved"));
            });
        });
}

function loadOptions() {

    optionsGlobal.background.getOptions().then((items: {[key: string]: any}) => {
        console.log(items);

        var optionsForm = $("#options");
        for (var option in items) {
            var optionControl = optionsForm.find("input[data-option-name='" + option + "']");
            if (optionControl.attr("type") === "checkbox") {
                optionControl.attr("checked", items[option]);
            } else {
                optionControl.val(items[option]);
            }
        }
        optionsForm.find("input").trigger("change");
    })

    $("#header").text(chrome.i18n.getMessage("FeedlyNotifierOptions"));
    $("#options").find("[data-locale-value]").each(function () {
        var textBox = $(this);
        var localValue = textBox.data("locale-value");
        textBox.text(chrome.i18n.getMessage(localValue));
    });
}

// @if BROWSER=='chrome'
function setBackgroundMode(enable: boolean) {
    if (enable) {
        chrome.permissions.request(optionsGlobal.backgroundPermission, function () {
        });
    } else {
        chrome.permissions.remove(optionsGlobal.backgroundPermission, function () {
        });
    }
}
// @endif

function setAllSitesPermission(enable: boolean, options: { [key: string] : any }, callback: () => void) {
    if (enable) {
        chrome.permissions.request(optionsGlobal.allSitesPermission, function (granted) {
            if ($("#showThumbnailInNotifications").is(":checked")) {
                $("#showThumbnailInNotifications").prop('checked', granted);
                options.showThumbnailInNotifications = granted;
            }

            if ($("#showBlogIconInNotifications").is(":checked")) {
                $("#showBlogIconInNotifications").prop('checked', granted);
                options.showBlogIconInNotifications = granted;
            }

            callback();
        });
    } else {
        callback();
    }
}