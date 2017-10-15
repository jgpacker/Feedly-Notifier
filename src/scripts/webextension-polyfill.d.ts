declare namespace browser.tabs {
    export function create(tabInfo: chrome.tabs.CreateProperties): Promise<void>
    export function query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]>
}

declare namespace browser.windows {
    export function create(createInfo: chrome.windows.CreateData): Promise<void>
    export function getAll(getInfo: chrome.windows.GetInfo): Promise<chrome.windows.Window[]>
}

declare module 'webextension-polyfill' {
    export = browser;
}