var connectWebSocket = function(map) {
    console.log("open socket");
    var socket = io('http://' + window.location.host);
    socket.on('new_msg', function (data) {
        console.log(data);
        var cords = data.stadium.coordinates.coordinates.reverse();
        var circle = L.circle(cords, 100000, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map);

        var ownCircle = null;
        if (data.coordinates) {
            ownCircle = L.circle(data.coordinates.coordinates.reverse(), 100000, {
                color: 'blue',
                fillColor: '#03',
                fillOpacity: 0.5
            }).addTo(map);
        }
        // var popup = L.popup()
        //     .setLatLng(cords)
        //     .setContent('<p><b>' + data.user + '</b>: ' + data.tweet + '</p>')
        //     .addTo(map);

        setTimeout(function() {
            map.removeLayer(circle);
            /* map.removeLayer(popup); */
            if (ownCircle) {
                map.removeLayer(ownCircle);
            }
        }, 5000);
    });
}

$(document).ready(function() {
    console.log("Ready");
    var map = L.map('map').setView([-10.783519, -47.899211], 5);
    L.tileLayer('http://tiles.lyrk.org/ls/{z}/{x}/{y}?apikey=1ed7ffbc9af144e1ae2d3da37136f624', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://geodienste.lyrk.de/">Lyrk</a>, Geocoding Courtesy of <a href="http://www.mapquest.com/">MapQuest</a>',
        maxZoom: 18
    }).addTo(map);

    connectWebSocket(map);
});

