function guess_song(event) {
    let answer = document.song.toLowerCase();
    let state_val = '';
    let x = event.keyCode;
    if(x == 8)
         state_val= '';
    if(x == 9)
        return null;
    if(x == 13){
        guess = document.getElementById("song_guess").value.toLowerCase();
        if(guess == answer)
            state_val = ':)';
        else if(guess != answer)
            state_val = 'X';
    }
    document.getElementById("song_state").innerHTML = state_val;
}

function guess_artist(event) {
    //TODO: Account for multiple artists
    let answer = document.artists;
    for(let i = 0; i < answer.length; i++){
        answer[i] = answer[i].toLowerCase();
    }
    let state_val = '';
    let x = event.keyCode;
    if(x == 8)
         state_val= '';
    if(x == 9)
        return null;
    if(x == 13){
        let guess = document.getElementById("artist_guess").value.toLowerCase();
        if(answer.includes(guess))
            state_val = ':)';
        else
            state_val = 'X';
    }
    document.getElementById("artist_state").innerHTML = state_val;
}

function guess_album(event) {
    let answer = document.album.toLowerCase();
    let state_val = '';
    let x = event.keyCode;
    if(x == 8)
         state_val= '';
    if(x == 9)
        return null;
    if(x == 13){
        let guess = document.getElementById("album_guess").value.toLowerCase();
        if(answer == guess)
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

function get_player_name() {
    return "SpotiFly Game";
}

function start_player(token) {
  const player = new Spotify.Player({
    name: get_player_name(),
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

  document.getElementById("header1").innerHTML = "Check Your Spotify App for \"" + get_player_name() + "\"";
}

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

  const authEndpoint = 'https://accounts.spotify.com/authorize';

  // Replace with your app's client ID, redirect URI and desired scopes
  const clientId = 'd5e546a8a593407b92e7ff95044e576e';
  const redirectUri = 'http://localhost:8000/new.html';
  const permission_scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-currently-playing",
      //"playlist-read-private",
      "user-modify-playback-state"
  ];

  // If there is no token, redirect to Spotify authorization
  if (!_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${permission_scopes.join('%20')}&response_type=token&show_dialog=true`;
  }
  document.token = _token;
  return _token;
}

function parse_artists(artists, length){
    let names = [];
    for(let i = 0; i<length; i++){
        names.push(artists[i].name);
    }
    return names;
}

function get_artists_str(artists){
    if(artists.length == 1){
        return "artist: " + artists[0];
    }else {
        return "artists: " + artists.join(", ");
    }
}

function send_simple_request(method, url_param){
    send_simple_request(method, url_param, true);
}

function send_simple_request(method, url_param, is_async) {
    $.ajax({
        type: method,
        url: url_param,
        async: is_async,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        }, success: function (data) {
            console.log(data);
        }
    });
}

function update_track(){
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        }, success: function(data){
            console.log(data);

            let song = data.item.name;
            if(song.includes("(feat."))
                song = song.substring(0, song.indexOf("(feat.") - 1);
            let num_artists = data.item.artists.length;
            let artists = parse_artists(data.item.artists, num_artists);
            let album = data.item.album.name;
            if(album.includes("(feat."))
                album = album.substring(0, album.indexOf("(feat.") - 1);
            let album_cover = data.item.album.images[0].url;

            document.getElementById("song_name").innerHTML =
                "<br>song: " + song +
                "<br>" + get_artists_str(artists) +
                "<br>album: " + album;
            document.getElementById("album_cover").innerHTML = "<img src=\"" +
                album_cover + "\" height=\"450\" width=\"auto\">";

            document.song = song;
            document.artists = artists;
            document.album = album;
        }
    });
}

function pause_resume_song(){
    let text = document.getElementById("pause").innerHTML;
    if(text == "PAUSE"){
        document.getElementById("pause").innerHTML = "RESUME";
        send_simple_request("PUT", "https://api.spotify.com/v1/me/player/pause");
    }else {
        document.getElementById("pause").innerHTML = "PAUSE";
        send_simple_request("PUT", "https://api.spotify.com/v1/me/player/play");
    }

    // TODO: SEND PAUSE/PLAY
}

function next_song(){
    send_simple_request("POST", "https://api.spotify.com/v1/me/player/next", false);
    update_track();
    update_track();
    update_track();
}

function set_song_position(position_sec){
    let position_ms = position_sec * 1000;
    $.ajax(JSON.stringify({
        url: "\thttps://api.spotify.com/v1/me/player/play",

        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.body = {}
        }, success: function(data){
            console.log(data);

            let song = data.item.name;
            if(song.includes("(feat."))
                song = song.substring(0, song.indexOf("(feat.") - 1);
            let num_artists = data.item.artists.length;
            let artists = parse_artists(data.item.artists, num_artists);
            let album = data.item.album.name;
            if(album.includes("(feat."))
                album = album.substring(0, album.indexOf("(feat.") - 1);
            let album_cover = data.item.album.images[0].url;

            document.getElementById("song_name").innerHTML =
                "<br>song: " + song +
                "<br>" + get_artists_str(artists) +
                "<br>album: " + album;
            document.getElementById("album_cover").innerHTML = "<img src=\"" +
                album_cover + "\" height=\"450\" width=\"auto\">";

        document.song = song;
        document.artists = artists;
        document.album = album;
        }
    }));
}

