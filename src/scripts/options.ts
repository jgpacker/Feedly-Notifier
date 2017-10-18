"use strict";

import * as $ from 'jquery';

import { FeedlyCategory } from './feedly';
import { ExtensionBackgroundPage } from './background';

interface OptionsPage {
    background: ExtensionBackgroundPage
}

var optionsGlobal: OptionsPage = {
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

function appendCategory(id: string, label: string): void {

    var categories = $("#categories");
    var $label = $("<label for='" + id + "' class='label' />").text(label);
    var $checkbox = $("<input id='" + id + "' type='checkbox' />").attr("data-id", id);
    categories.append($label);
    categories.append($checkbox);
    categories.append("<br/>");
}

function parseFilters(): string[] {
    var filters: string[] = [];
    $("#categories").find("input[type='checkbox']:checked").each(function (key, value) {
        var checkbox = $(value);
        filters.push(checkbox.data("id"));
    });
    return filters;
}

function loadOptions(): void {
    
    optionsGlobal.background.loadOptions().then((items: {[key: string]: any}) => {
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

function saveOptions(): void {

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
    options.enableBackgroundMode = $("#enable-background-mode").is(":checked");
    options.showBlogIconInNotifications = $("#showBlogIconInNotifications").is(":checked");
    options.showThumbnailInNotifications = $("#showThumbnailInNotifications").is(":checked");

    optionsGlobal.background.saveOptions(options).then(() => {
        alert(chrome.i18n.getMessage("OptionsSaved"));
    });

}