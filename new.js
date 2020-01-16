window.onSpotifyWebPlaybackSDKReady = async () => {
    let token = auth();
    let x = await start_player(token);
    console.log(x);
    await play_this_browser();
    update_track();
};

evaluate_answers = () => {
    if(
        document.getElementById("song_guess").disabled === true
        && document.getElementById("artist_guess").disabled === true
        && document.getElementById("album_guess").disabled === true
    ){
        document.getElementById("album_cover").classList.remove("album_covered");
    }
};

guess_song = (event) => {
    let correct = false;
    let answer = document.song;
    let state_val = '';
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    else if(x === "Tab")
        return null;
    else if(x === "Enter"){
        let guess = document.getElementById("song_guess").value.toLowerCase();
        if(guess === answer.toLowerCase()){
            correct = true;
        }else if(answer.includes('(') && answer.includes(')')){
            let pos_a = answer.lastIndexOf('(');
            let pos_b = answer.lastIndexOf(')');
            if(pos_b < pos_a){
                state_val = ':(';
            }
            let primary = answer.substr(0, pos_a - 1).toLowerCase();
            let secondary = answer.substr(pos_a + 1, (pos_b - 1) - pos_a).toLowerCase();
            console.log(secondary);
            if([primary, secondary].includes(guess))
                correct = true;
            else
                state_val = ':(';
        }else
            state_val = ':(';
    }
    if(correct){
        state_val = ':)';
            document.getElementById("song_guess").value = answer;
            document.getElementById("song_guess").disabled = true;
            document.getElementById("artist_guess").focus();
            evaluate_answers();
    }

    document.getElementById("song_state").innerHTML = state_val;
};

guess_artist = (event) => {
    let answer = document.artists;
    let answer_lc = [];
    for(let i = 0; i < answer.length; i++){
        answer_lc.push(answer[i].toLowerCase());
    }
    let state_val = '';
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    if(x === "Tab")
        return null;
    if(x === "Enter") {
        let guess = document.getElementById("artist_guess").value.toLowerCase();
        if (answer_lc.includes(guess)) {
            document.getElementById("artist_guess").value = answer.join(', ');
            document.getElementById("artist_guess").disabled = true;
            document.getElementById("album_guess").focus();
            state_val = ':)';
            evaluate_answers();
        }else
            state_val = ':(';
    }
    document.getElementById("artist_state").innerHTML = state_val;
};

guess_album = (event) => {
    let answer = document.album;
    let state_val = '';
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    if(x === "Tab")
        return null;
    if(x === "Enter"){
        let guess = document.getElementById("album_guess").value.toLowerCase();
        if(answer.toLowerCase() == guess) {
            document.getElementById("album_guess").value = answer;
            document.getElementById("album_guess").disabled = true;
            state_val = ':)';
            evaluate_answers();
        }else
            state_val = ':(';
    }
    document.getElementById("album_state").innerHTML = state_val;
};

get_player_name = () => {
    return "SpotiFly Game";
};

start_player = async (token) => {
    return new Promise((resolve, reject) => {
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
            document.player_id = device_id;
            resolve("Player Started :)")
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        // Connect to the player!
        player.connect();
    });
};

auth = () => {
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
      "user-read-playback-state",
      "user-modify-playback-state"
  ];

  // If there is no token, redirect to Spotify authorization
  if (!_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${permission_scopes.join('%20')}&response_type=token&show_dialog=true`;
  }
  document.token = _token;
  return _token;
};

parse_artists = (artists, length) => {
    let names = [];
    for(let i = 0; i<length; i++){
        names.push(artists[i].name);
    }
    return names;
};

get_artists_str = (artists) => {
    if(artists.length === 1){
        return "artist: " + artists[0];
    }else {
        return "artists: " + artists.join(", ");
    }
};

send_simple_request = (method, url_param) => {
    $.ajax({
        type: method,
        url: url_param,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        }, success: function (data) {
            if(data)
                console.log(data);
            else
                console.log("no data");
            setTimeout(function(){update_track()}, 500);
        }
    });
};

send_simple_request_with_pay = (method, url_param, payload, is_async) => {
    $.ajax({
        type: method,
        url: url_param,
        data: JSON.stringify(payload),
        async: is_async,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        }, success: function (data) {
            console.log(data);
        }
    });
};

track_mismatch = () => {
    return (
        (document.getElementById("song_guess").disabled
            && document.getElementById("song_guess").value !== document.song)
        ||(document.getElementById("artist_guess").disabled
            && document.getElementById("artist_guess").value !== document.artists.join(", "))
        ||(document.getElementById("album_guess").disabled
            && document.getElementById("album_guess").value !== document.album)
        )
};

update_track = () => {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + document.token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        }, success: function(data){
            if(data)
                console.log(data);
            else
                console.log("No return data.");

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

            if(track_mismatch()){
                reset_guessing_fields();
            }
        }
    });
};

pause_song = () => {
    document.getElementById("pause").innerHTML = "RESUME";
    send_simple_request("PUT", "https://api.spotify.com/v1/me/player/pause");
};

resume_song = () => {
    document.getElementById("pause").innerHTML = "PAUSE";
    send_simple_request("PUT", "https://api.spotify.com/v1/me/player/play");
};

pause_resume_song = () => {
    let text = document.getElementById("pause").innerHTML;
    if(text == "PAUSE")
        pause_song();
    else
        resume_song();
};

next_song = () => {
    send_simple_request("POST", "https://api.spotify.com/v1/me/player/next");
    reset_guessing_fields();
};

play_this_browser = () => {
    return new Promise((resolve, reject) => {
        const url_param = "https://api.spotify.com/v1/me/player";
        const payload = {"device_ids":[document.player_id]};

        send_simple_request_with_pay("PUT", url_param, payload, true);
        resolve("playing in this browser!");
    });
};

reset_guessing_fields = () => {
    let empty_str = "";
    document.getElementById("song_state").innerHTML = empty_str;
    document.getElementById("artist_state").innerHTML = empty_str;
    document.getElementById("album_state").innerHTML = empty_str;
    document.getElementById("song_guess").value = empty_str;
    document.getElementById("artist_guess").value = empty_str;
    document.getElementById("album_guess").value = empty_str;
    document.getElementById("song_guess").disabled = false;
    document.getElementById("artist_guess").disabled = false;
    document.getElementById("album_guess").disabled = false;
    document.getElementById("song_guess").focus();
    document.getElementById("album_cover").classList.add("album_covered");
};

calculate_end_song = () => {
    return null;
};
