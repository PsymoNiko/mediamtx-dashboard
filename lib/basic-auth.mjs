function bytesToBinary(bytes) {
  const chunkSize = 0x8000
  let binary = ""

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return binary
}

export function encodeBasicAuthCredentials(username, password) {
  const credentials = `${username}:${password}`

  if (typeof TextEncoder !== "undefined" && typeof btoa === "function") {
    return btoa(bytesToBinary(new TextEncoder().encode(credentials)))
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(credentials, "utf8").toString("base64")
  }

  throw new Error("No Base64 encoder is available")
}
