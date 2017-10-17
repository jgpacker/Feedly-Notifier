export default class FeedlyApiClient {

    public accessToken: string;
    private apiUrl :string;
    private secureApiUrl :string;
    private extensionVersion :string;

    constructor() {
        this.apiUrl = "http://cloud.feedly.com/v3/";
        this.secureApiUrl = "https://cloud.feedly.com/v3/";
        this.extensionVersion = chrome.runtime.getManifest().version;
    }

    public getMethodUrl(methodName: string, parameters: any, useSecureConnection: boolean): string {
        if (methodName === undefined) {
            return "";
        }

        let methodUrl = (useSecureConnection ? this.secureApiUrl : this.apiUrl) + methodName;

        let queryString = "?";
        for (let parameterName in parameters) {
            queryString += parameterName + "=" + parameters[parameterName] + "&";
        }

        let browserPrefix;
        // @if BROWSER='chrome'
        browserPrefix = "c";
        // @endif

        // @if BROWSER='opera'
        browserPrefix = "o";
        // @endif

        // @if BROWSER='firefox'
        browserPrefix = "f";
        // @endif

        queryString += "av=" + browserPrefix + this.extensionVersion;

        methodUrl += queryString;

        return methodUrl;
    };

    public request(methodName: string, settings: any): Promise<any> {
        function status(response: Response) {
            if (response.status === 200) {
                return Promise.resolve(response);
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        }

        function json(response: Response) {
            return response.json();
        }

        let url = this.getMethodUrl(methodName, settings.parameters, settings.useSecureConnection);
        let verb = settings.method || "GET";

        // For bypassing the cache
        if (verb === "GET") {
            url += ((/\?/).test(url) ? "&" : "?") + "ck=" + (new Date()).getTime();
        }

        let headers: any = {};
        if (this.accessToken) {
            headers.Authorization = "OAuth " + this.accessToken;
        }

        let requestParameters: RequestInit = {
            method: verb,
            headers: headers
        };

        if (settings.body) {
            requestParameters.body = JSON.stringify(settings.body);
        }

        return fetch(url, requestParameters)
            .then(status)
            .then(json);
    };
};