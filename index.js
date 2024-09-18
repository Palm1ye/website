// Define some useful variables
const statusIcon = document.getElementById("statusIcon");
const listeningStatus = document.getElementById("listeningStatus");
const listeningContent = document.getElementById("listeningContent");

const customStatus = document.getElementById("customStatus");

const spotifyCard = document.getElementById("spotifyCard");
const spotifyArtist = document.getElementById("spotifyArtist");
const spotifySong = document.getElementById("spotifySong");
const spotifyCover = document.getElementById("spotifyCover");
const linkToCover = document.getElementById("linkToCover");

const startTime = document.getElementById("startTime")
const endTime = document.getElementById("endTime")

// Initialize websocket session
const lanyard = new WebSocket("wss://api.lanyard.rest/socket");

let dscdata = {};
let received = false;
let playing = false;

window.setInterval(() => {
  if(!playing) return;
  let activities = dscdata.d.activities;
  if(!activities.length) return;

  let activity = activities.find(z => z.name === "Spotify");
  if(!activity) return;

  let songLength = activity.timestamps.end-activity.timestamps.start;
  let timePassed = Date.now()-activity.timestamps.start;
  let progress = ((100 * timePassed) / songLength);
  console.log(progress, Math.floor(songLength-timePassed)/1000);
  
  document.getElementById('progressbar').style.width = `${progress}%`;

  const endTimestamp = { 
    minutes: new Date(songLength).getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    seconds: new Date(songLength).getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2})
  }

  const timePassedTimestamp = {
    minutes: new Date(timePassed).getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    seconds: new Date(timePassed).getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2})
  }

  startTime.innerHTML = `${timePassedTimestamp.minutes}:${timePassedTimestamp.seconds}`
  endTime.innerHTML = `${endTimestamp.minutes}:${endTimestamp.seconds}`


}, 1000)

// Subscribe for Discord ID
lanyard.onopen = () => {
  lanyard.send(
    JSON.stringify({
      op: 2,
      d: {
        subscribe_to_id: "307993889006944256",
      },
    })
  );
};

// Send a heartbeat every 30 seconds
setInterval(() => {
  if (received) {
    lanyard.send(
      JSON.stringify({
        op: 3,
      })
    );
  }
}, 30000);

// Update once a new data is received
lanyard.onmessage = (event) => {
  received = true;
  dscdata = JSON.parse(event.data);
  console.log(dscdata);

  if (dscdata.t === "INIT_STATE" || dscdata.t === "PRESENCE_UPDATE") {
    update_presence();
  }
};

const update_presence = () => {
  if (statusIcon != null) {
    // Update the status icon only if it exists
    // status_on();
    update_status(dscdata.d.discord_status);
  }

  if (dscdata.d.listening_to_spotify === true) {
    // Enable the listening mode, Spotify is active
    listening_on();

    // Escape artist names including other artist names
    const artist = `${
      dscdata.d.spotify.artist.split(";")[0].split(",")[0]
    }`;
    // Escape song names with uneeded information
    const song = `${dscdata.d.spotify.song}`;

    // Update the text directly from the HTML if changed
    // if (listeningContent.innerHTML.includes(song) == false) {

    spotifyArtist.innerHTML = artist;
    spotifySong.innerHTML = song;
    spotifySong.title = song;
    spotifyCover.src = dscdata.d.spotify.album_art_url;
    linkToCover.href = `https://open.spotify.com/track/${dscdata.d.spotify.track_id}`;
    spotifyArtist.href = `https://open.spotify.com/track/${dscdata.d.spotify.track_id}`;
    // }
  } else {
    // Spotify session is not active (anymore)
    listening_off();
  }
}

const update_status = (status) => {
  let currentStatus = "";
  // Define the color and tippy text based of the status

  if (status === "online") {
    statusIcon.style.backgroundColor = "green";
    currentStatus = "Online";
  }
  if (status === "idle") {
    statusIcon.style.backgroundColor = "yellow";
    currentStatus = "Away";
  } 
  if (status === "dnd") {
    statusIcon.style.backgroundColor = "red";
    currentStatus = "Do not disturb";
  } 
  if (status === "offline") {
    statusIcon.style.backgroundColor = "gray";
    currentStatus = "Offline";
  }
  customStatus.innerHTML = dscdata.d.activities[0] && dscdata.d.activities[0].name === "Custom Status" 
  ? dscdata.d.activities[0].state 
  : currentStatus;
}

const listening_off = () => {
  // Make the listening mode disappear if Spotify is inactive
  spotifyCard.style.display = "none";
  noMusicMessage.style.display = "block";
  playing = false;
}

const listening_on = () => {
  // Make the listening mode appear if Spotify is active
  spotifyCard.style.display = "";
    noMusicMessage.style.display = "none";
    playing = true;
}

// const status_on = () => {
//   // Make the status appear with the Discord data
//   statusIcon.classList.replace("hidden", "inline-flex");
// }

// const status_off = () => {
//   // Hide the status appear if no Discord data received
//   statusIcon.classList.replace("inline-flex", "hidden");
// }