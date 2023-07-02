# StreamKitHelper

just a bunch of scripts i put together so i can do streams with friends easier.<br>
could i have just used other programs? yes. but i liked the idea of doing it on my own.

## Scripts

[index.js](index.js): The base server script. Written for Node.js. This handles pretty much everything.
<br>
[vencord_plugin](vencord_plugin): A plugin written for Vencord, to hook into the client and capture VC events, and send them to the base server.
<br>
[update_streamkit.py](update_streamkit.py): An OBS python script for automatically updating the voice overlay from the base server.
<br>
[index.html](index.html): Accessible from the root path of the base server's address, this is meant to be used as an OBS overlay, for displaying the PNGtubers.
<br>
[speaking.js](speaking.js): The script, meant to be hooked with [index.html], which would connect to the base server and handle the PNGtuber bounces based on speech.