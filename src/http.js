const baseUrl = '/.netlify/functions';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const buildUrl = url => `${url.slice(0, 4) === 'http' ? '' : baseUrl}${url}`

const jsonResponse = (response) => {
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
};

export const get = (url, { headers }) => fetch(
    buildUrl(url),
    {
        method: 'GET',
        headers,
    }
).then(jsonResponse);

export const post = (url, body) => fetch(
    buildUrl(url),
    {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }
).then(jsonResponse);

const http = { post, get };

export default http;

