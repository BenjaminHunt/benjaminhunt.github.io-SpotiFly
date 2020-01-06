function guess_song(event) {
    answer = 'song';
    state_val = '';
    var x = event.keyCode;
    if(event.keyCode == 8)
         state_val= '';
    if(event.keyCode == 9)
        return null;
    if(event.keyCode == 13){
        guess = document.getElementById("song_guess").value;
        if(guess == answer)
            state_val = ':)';
        else if(guess != answer)
            state_val = 'X';
    }
    document.getElementById("song_state").innerHTML = state_val;
}

function guess_artist(event) {
    answer = 'artist';
    state_val = '';
    var x = event.keyCode;
    if(event.keyCode == 8)
         state_val= '';
    if(event.keyCode == 9)
        return null;
    if(event.keyCode == 13){
        guess = document.getElementById("artist_guess").value;
        if(guess == answer)
            state_val = ':)';
        else
            state_val = 'X';
    }
    document.getElementById("artist_state").innerHTML = state_val;
}

function guess_album(event) {
    answer = 'album';
    state_val = '';
    var x = event.keyCode;
    if(event.keyCode == 8)
         state_val= '';
    if(event.keyCode == 9)
        return null;
    if(event.keyCode == 13){
        guess = document.getElementById("album_guess").value;
        if(guess == answer)
            state_val = ':)';
        else
            state_val = 'X';
    }
    document.getElementById("album_state").innerHTML = state_val;
}

window.onSpotifyWebPlaybackSDKReady = () => {
  let token = auth();
  start_player(token);
};

function start_player(token) {
  const player = new Spotify.Player({
    name: 'Spotifly Game',
    getOAuthToken: cb => { cb(token); }
  });

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  player.addListener('player_state_changed', state => { console.log(state); });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};

function auth() {
  // Get the hash of the url
  const hash = window.location.hash
  .substring(1)
  .split('&')
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
  window.location.hash = '';

  // Set token
  let _token = hash.access_token;
  //createCookie("spotify_token", _token, 2);

  //document.getElementById("token_block").innerHTML = "<br>token: " + _token;

  const authEndpoint = 'https://accounts.spotify.com/authorize';

  // Replace with your app's client ID, redirect URI and desired scopes
  const clientId = 'd5e546a8a593407b92e7ff95044e576e';
  const redirectUri = 'http://localhost:8000/new.html';
  const scopes = ["streaming", "user-read-email", "user-read-private"];

  // If there is no token, redirect to Spotify authorization
  if (!_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
  }
  return _token;
}