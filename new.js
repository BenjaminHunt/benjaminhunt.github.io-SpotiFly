function Timer(callback, delay){
    let timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= Date.now() - start;
    };

    this.resume = function() {
        start = Date.now();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };

    this.get_time_remaining = function(){
        return remaining;
    };

    this.reset_timer = function(delay){
        remaining = delay;
        this.resume();
    };

    this.resume();
}

window.onSpotifyWebPlaybackSDKReady = async () => {
    let token = auth();
    let x = await start_player(token);
    console.log(x);
    await play_this_browser();
    console.log("playing this device");
    await resume_song(); // do i want to?
    // update_track(); // doesn't work here?
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

guess_matches_enough = (guess, answer) => {
    guess = guess.toLowerCase();
    answer = answer.toLowerCase();

    //and substitution
    if(answer.includes("+") || answer.includes("&") || answer.includes("and")){
        answer = answer.replace("+", "&");
        answer = answer.replace("&", " & ");
        answer = answer.replace("&", "and");
        answer = answer.replace(/\s+/g,' ').trim();answer = answer.replace("+", "&");
        guess = guess.replace("&", " & ");
        guess = guess.replace("&", "and");
        guess = guess.replace(/\s+/g,' ').trim();
        console.log("GUESS: " + guess);
        console.log("ACCEPT: " + answer);
    }
    if(guess === answer){
        return true;
    }else{
        let correct = true;
        answer = answer.replace(/[^!@&#$?()/=% a-zA-Z0-9]/g, "*");
        let i;
        for(i = 0; i < guess.length; i++){
            if(!(guess[i] === answer[i] || answer[i] === "*")){
                correct = false;
            }
        }
        return correct;
    }
};

clean_album_name = (album) => {
    let album_trimmed = album;
    let tag_text = false;
    if(album.includes('(') && album.includes(')')){
        let pos_a = album.lastIndexOf('(');
        let pos_b = album.lastIndexOf(')');
        if(pos_b > pos_a){
            album_trimmed = album.substr(0, pos_a - 1);
            tag_text = album.substr(pos_a + 1, (pos_b - 1) - pos_a); //TODO: Maybe verify its excessive?
        }
        return album_trimmed;
    }
    return album;
};

guess_song = (event) => {
    let correct = false;
    let state_val = '';
    let answer = document.song;
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    else if(x === "Tab")
        return null;
    else if(x === "Enter"){
        let guess = document.getElementById("song_guess").value;
        if(guess_matches_enough(guess, answer)){
            correct = true;
        }else if(answer.includes('(') && answer.includes(')')){
            let pos_a = answer.lastIndexOf('(');
            let pos_b = answer.lastIndexOf(')');
            if(pos_b < pos_a){
                state_val = ':(';
            }
            let primary = answer.substr(0, pos_a - 1);
            let secondary = answer.substr(pos_a + 1, (pos_b - 1) - pos_a);
            if(guess_matches_enough(primary, answer) || guess_matches_enough(secondary, answer))
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
    let correct = false;
    let state_val = '';
    let answer = document.artists;
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    if(x === "Tab")
        return null;
    if(x === "Enter") {
        let guess = document.getElementById("artist_guess").value;
        answer.forEach(artist => {
            if(guess_matches_enough(guess, artist)){
                correct = true;
            }
        });
        if(!correct)
            state_val = ':(';
    }

    if(correct){
        document.getElementById("artist_guess").value = answer.join(', ');
        document.getElementById("artist_guess").disabled = true;
        document.getElementById("album_guess").focus();
        state_val = ':)';
        evaluate_answers();
    }
    document.getElementById("artist_state").innerHTML = state_val;
};

guess_album = (event) => {
    let correct = false;
    let state_val = '';
    // let answer = clean_album_name(document.album); //TODO: Do I want to remove excess tags here?
    let answer = [document.album, clean_album_name(document.album)];
    let x = event.code;
    if(x === "Backspace")
         state_val= '';
    if(x === "Tab")
        return null;
    if(x === "Enter"){
        let guess = document.getElementById("album_guess").value;
        answer.forEach(accepted_album_name => {
            if(guess_matches_enough(guess, accepted_album_name)){
                correct = true;
            }
        });
        if(!correct)
            state_val = ':(';
    }
    if(correct){
        document.getElementById("album_guess").value = document.album;
        document.getElementById("album_guess").disabled = true;
        state_val = ':)';
        evaluate_answers();
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
        player.addListener('player_state_changed', state => {
            console.log(state);
            process_state_change(state);
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            document.player_id = device_id;
            resolve("Player Started :)");
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
            if(data){
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

                document.pos = data.progress_ms;

                document.song = song;
                document.artists = artists;
                document.album = album;
            }
            else
                console.log("No return data.");

            if(track_mismatch()){
                reset_guessing_fields();
            }
        }
    });
};

pause_song = () => {
    document.getElementById("pause").innerHTML = "RESUME";
    send_simple_request("PUT", "https://api.spotify.com/v1/me/player/pause");
    if(document.update_timer) {
        document.update_timer.pause();
        console.log("Song and scheduled update paused.");
    }
};

resume_song = () => {
    document.getElementById("pause").innerHTML = "PAUSE";
    send_simple_request("PUT", "https://api.spotify.com/v1/me/player/play");
    if(document.update_timer) {
        document.update_timer.resume();
        console.log("Song and scheduled update resumed.");
    }
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

process_state_change = (state) => {
    let pos = state.position;
    document.pos = pos;
    let dur = state.duration;
    let is_paused = state.paused;
    // console.log("pos: (" + pos + "/" + dur + ") ms");
    // console.log("paused: "+ is_paused);
    if(pos === 0 || pos < document.pos) {
        update_track();
    }
    schedule_update(pos, dur);
    // else schedule next update
    // reset_guessing_fields()
};

schedule_update = (pos, dur) => {
    // document.update_timer = null;
    let time_ms = dur - pos;
    if(!document.update_timer){
        document.update_timer = new Timer(() => {
            update_track();
            console.log("Scheduled update created.");
        }, time_ms + 300);
    }
    else{
        document.update_timer.reset_timer(time_ms);
        console.log("Update Timer Set.");
    }
};
