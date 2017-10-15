export interface FeedlyCategory {
    id: string,
    label: string,
    description?: string
}

// https://developer.feedly.com/v3/entries/
export interface FeedlyEntry {
    id: string;
    title?: string;
    content?: FeedlyEntryContent;
    summary?: FeedlyEntryContent;
    keywords?: string[];
    originId: string;
    fingerprint: string;
    crawled: number;
    // recrawled: any,
    // thumbnail: any,
    
    unread: false;
    author?: string;
    categories: FeedlyCategory[];
    origin?: FeedlyEntryOrigin;
    engagement?: number;
    thumbnail: FeedlyImage[];
    tags?: FeedlyTag[];
    alternate?: FeedlyLinkObject[]
}

export interface FeedlyLinkObject {
    href: string;
    type?: string;
}

export interface FeedlyImage {
    url: string;
}

export interface FeedlyEntryOrigin {
    streamId: string;
    title: string;
    htmlUrl: string;
}

export interface FeedlyEntryContent {
    direction: string,
    content: string
}

export interface FeedlyStream {
    id: string;
    title: string;
    direction: string;
    continuation: string;
    //self: any,
    //alternae: any,
    //updated: any,
    items: FeedlyEntry[];
}

export interface FeedlySubscription {
    id: string;
    title: string;
    categories: FeedlyCategory[];

}

export interface FeedlyTag {
    id: string;
    label?: string;
}

export interface FeedlyUnreadCount {
    id: string;
    count: number;
}

export interface MarkerCounts {
    unreadcounts: FeedlyUnreadCount[];
    updated: any;
}

export interface FeedlyAuthToken {
    id: string;
    refresh_token?: string;
    access_token?: string;
    expires_in: number;
    token_type?: string;
    plan?: string;
    state?: string;
}