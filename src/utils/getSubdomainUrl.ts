export function getSubdomainUrl(sub: string): string {
  if (typeof window === 'undefined') {
    return `https://${sub.length > 0 ? sub + "." : ""}jino.lmcgroup.xyz`;
  }

  const { protocol, hostname, port } = window.location;
    let baseDomain: string

  if (hostname.includes('localhost')) {
    baseDomain = sub && sub !== 'site'
      ? `${sub.length > 0 ? sub + "." : ""}localhost${port ? `:${port}` : ''}`
      : `localhost${port ? `:${port}` : ''}`;
    } else {
        const domain = hostname.split('.').slice(-2).join('.');
        baseDomain = (sub.length > 0 && sub !== "site") ? `${sub.length > 0 ? sub + "." : ""}${domain}` : domain
    }

    return `${protocol}//${baseDomain}`
}