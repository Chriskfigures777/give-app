// src/index.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
var BUCKET = "give-published-sites";
var REGION = "us-east-1";
var domainMap = null;
var mapLoadedAt = 0;
var MAP_TTL_MS = 6e4;
var s3 = new S3Client({ region: REGION });
async function loadDomainMap() {
  if (domainMap && Date.now() - mapLoadedAt < MAP_TTL_MS) {
    return domainMap;
  }
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: "_domains/domain-map.json" })
    );
    const body = await resp.Body?.transformToString("utf-8");
    domainMap = body ? JSON.parse(body) : {};
    mapLoadedAt = Date.now();
  } catch {
    if (!domainMap) domainMap = {};
  }
  return domainMap;
}
async function handler(event) {
  const request = event.Records[0].cf.request;
  const host = (request.headers.host?.[0]?.value ?? "").toLowerCase();
  const map = await loadDomainMap();
  const orgSlug = map[host];
  if (!orgSlug) {
    return {
      status: "404",
      statusDescription: "Not Found",
      body: "<!DOCTYPE html><html><body><h1>Site not found</h1></body></html>",
      headers: { "content-type": [{ key: "Content-Type", value: "text/html" }] }
    };
  }
  let uri = request.uri || "/";
  if (uri.length > 1 && uri.endsWith("/")) {
    uri = uri.slice(0, -1);
  }
  if (uri === "/" || uri === "") {
    request.uri = `/${orgSlug}/index.html`;
  } else {
    request.uri = `/${orgSlug}${uri}/index.html`;
  }
  return request;
}
export {
  handler
};
