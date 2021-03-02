const SpotifyWebApi = require('spotify-web-api-node');
const tmi = require('tmi.js');
var List = require("collections/list");
const superagent = require('superagent');

//vars for control
let playing = false;
let queued = false;
let playlistId = "57atkfNvyIRzdJqXrYe4oQ";
 //Songs List
let list = new List();
const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];

var spotifyApi = new SpotifyWebApi({
    clientId: '1de8346f83be49e286c3d14965a5a6f8',
    clientSecret: '0c2d8c0a6849480d8b300c31a455d030',

});

spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
  },
  function(err) {
    console.log('Something went wrong when retrieving an access token', err);
  }
);

const client = new tmi.Client({
    options: { debug: true },
    connection: {
      reconnect: true,
      secure: true
    },
    channels: [ 'radiokhaos' ]
});

client.connect().catch(console.error);
  //Storing successful requests
client.on('message', (channel, tags, message, self) => {
  if (message[0] != "!" && !message['&']){
    return;
  }
    console.log(message)
    if(self) return;
    let songartist = nameSongAndArtist(message);
    var song = songartist[0];
    var artist = songartist[1];
    spotifyApi.searchTracks(`track:${song} artist:${artist}`, { limit : 1})
  .then(function(data) {
    console.log(`Search tracks by "${song}" in the track name and "${artist}" in the artist name.`);
    var content = data.body.tracks.items[0];
    console.log(content)
    var songToStore = {
      artists: content.artists,
      song: content.name,
      uri: content.uri,
      id: content.id,
      durationMs: content.duration_ms
      }
      console.log(songToStore)
      return songToStore
  }).then(function(songToStore){
    if (playing){
      list.Add(songToStore);
      queued = true;
    } else {
      playing=true;
      setTimeout(() => {
        playing = false;
      }, songToStore.durationMs);
      playNow(songToStore);
    }
  }).catch(function(err){
    console.log('unable to find song', err);
  })
});

if (!playing && queued){
    playing = true;
    spotifyApi.addTracksToPlaylist(
      playlistId,
      [
        list.one().uri
      ],
      {
        position: 1
      }).then(function(response){
        console.log("song stored", response)
      }).catch(function(error){
        console.log("unbale to store song", error)
      })
      list.deleteAll()
      queued = false;
}


const nameSongAndArtist = (message) => {
      let divIndex = message.indexOf("&");
      console.log(divIndex)
      if (divIndex == -1){
        return;
      } else {
        let song = message.slice(1, divIndex);
        console.log(song)
        let artist = message.slice(divIndex+1,);
        console.log(artist)
        return [song, artist];
      }
}

async function getToken() {
  const result = await spotify.clientCredentialsGrant()
  return result.body.access_token
};

const playNow = (song) => {
spotifyApi.addTracksToPlaylist(
      playlistId,
      [
        song.uri
      ],
      {
        position: 1
      }
    )
  .then(function(data) {
    console.log(`Added ${data.playlistId[0].name}`);
  })
  .catch(function(err) {
    console.log('Something went wrong:', err.message);
  })
};