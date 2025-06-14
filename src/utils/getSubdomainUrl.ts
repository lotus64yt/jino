"use client";

export function getSubdomainUrl(sub: string, window?: Window | undefined): string {
    if (typeof window === 'undefined') return `https://${sub || ""}${sub.length > 0 ? "." : ""}jino.lmcgroup.xyz`;

    const { protocol, hostname, port } = window.location
    let baseDomain: string

    if (hostname.includes('localhost')) {
        baseDomain = (sub.length > 0 && sub !== "site")
            ? `${sub}.localhost${port ? `:${port}` : ''}`
            : `localhost${port ? `:${port}` : ''}`
    } else {
        const domain = hostname.split('.').slice(-2).join('.')
        baseDomain = (sub.length > 0 && sub !== "site") ? `${sub}.${domain}` : domain
    }

    return `${protocol}//${baseDomain}`
}