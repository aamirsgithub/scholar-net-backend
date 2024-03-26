const axios = require("axios");
const { getToken } = require("./getToken");

const createZoomMeeting = async (userId = "me", meetingDetails = {}) => {
  const { access_token, error } = await getToken();
  // const access_token = getToken();
  if (error) {
    console.error("Failed to get Zoom access token:", error);
    return null;
  }
  try {
    const response = await axios.post(
      `https://api.zoom.us/v2/users/${userId}/meetings`,
      meetingDetails,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    return null;
  }
};

module.exports = { createZoomMeeting };
