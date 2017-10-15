export interface Feed {
    id: string;
    title: string;
    titleDirection?: string;
    url: string;
    // // html or text
    content: string;
    contentDirection: string;
    date: Date;
    isoDate: string;
    isSaved: boolean;
    // // blog title
    blog: string;
    blogTitleDirection: string;
    blogUrl: string;
    // // blog icon url
    blogIcon: string;
    // // thumbnail url
    thumbnail?: string;
    categories: FeedCategory[];
    author?: string
}

export interface FeedCategory {
    id: string;
    encodedId: string;
    label: string;
}