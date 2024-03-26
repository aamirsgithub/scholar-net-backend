const axios = require("axios");
const querystring = require("querystring");
// const { ZOOM_OAUTH_ENDPOINT } = 'https://zoom.us/oauth/token';
const ZoomToken = require("../model/zoomToken");
require("dotenv").config();

/**
 * Retrieve token from Zoom API and update database
 *
 * @returns {Object} { access_token, expires_in, error }
 */
const getToken = async () => {
  // Try to retrieve the existing token from the database
  const existingToken = await ZoomToken.findOne({});
  if (existingToken && existingToken.expires_at > new Date()) {
    return {
      access_token: existingToken.access_token,
      expires_in: Math.floor(
        (existingToken.expires_at.getTime() - Date.now()) / 1000
      ),
      error: null,
    };
  }

  // Fetch new token from Zoom API if no valid token exists
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
    console.log(
      ".env id,client id, client secret",
      ZOOM_ACCOUNT_ID,
      ZOOM_CLIENT_ID,
      ZOOM_CLIENT_SECRET
    );
    debugger;
    const request = await axios.post(
      `https://zoom.us/oauth/token`,
      querystring.stringify({
        grant_type: "account_credentials",
        account_id: ZOOM_ACCOUNT_ID,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    const { access_token, expires_in } = request.data;

    // Update or create the token in the database
    const expires_at = new Date(Date.now() + expires_in * 1000);
    if (existingToken) {
      existingToken.access_token = access_token;
      existingToken.expires_at = expires_at;
      await existingToken.save();
    } else {
      await ZoomToken.create({ access_token, expires_at });
    }

    return { access_token, expires_in, error: null };
  } catch (error) {
    console.error("Error fetching Zoom token:", error);
    return { access_token: null, expires_in: null, error };
  }
};

module.exports = {
  getToken,
};
