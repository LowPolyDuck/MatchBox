export const getBaseUrl = () => {
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://matchbox.mezo.org"
    if (baseUrl && !baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`
    }
    return baseUrl.replace(/\/$/, "")
}

export const getOgImageUrl = () => {
    return `${getBaseUrl()}/og.png`
}
