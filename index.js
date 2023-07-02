const fs = require('fs');
const express = require('express');
const app = express();
const WebSocket = require('ws');
const axios = require('axios').default;
const config = require('./config.json');

const URL = `https://streamkit.discord.com/overlay/voice/%guild_id%/%channel_id%?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=3&invite_code=&limit_speaking=true&small_avatars=false&hide_names=false&fade_chat=0`;

let currentGuildId = '0';
let currentChannelId = '0';

let currentMembers = [];

app.use(express.static('.'));

/**
 * @type {Set<WebSocket>}
 */
const displays = new Set();

app.get('/:guild_id/:channel_id', (req, res) => {
    const guildId = req.params.guild_id;
    const channelId = req.params.channel_id;

    console.log(guildId, channelId);

    currentChannelId = channelId;
    currentGuildId = guildId;

    currentMembers = [];

    sendToAll({
        op: 'update_members',
        d: {
            members: currentMembers
        }
    });

    sendToAll({
        op: 'append_discord',
        d: {
            url: URL.replace(/%guild_id%/g, currentGuildId).replace(/%channel_id%/g, currentChannelId)
        }
    });
    
    res.send('got it');
});

app.get('/speaking/start/:user_id', (req, res) => {
    if (!currentMembers.includes(req.params.user_id))
        currentMembers.push(req.params.user_id);

    sendToAll({
        op: 'update_members',
        d: {
            members: currentMembers
        }
    });

    sendToAll({
        op: 'start_speaking',
        d: {
            user_id: req.params.user_id
        }
    });

    res.send('got it');
});

app.get('/speaking/stop/:user_id', (req, res) => {
    sendToAll({
        op: 'stop_speaking',
        d: {
            user_id: req.params.user_id
        }
    });

    res.send('got it');
});

app.get('/states', (req, res) => {
    const ids = req.query.members.split(',');
    currentMembers = ids;

    sendToAll({
        op: 'update_members',
        d: {
            members: currentMembers
        }
    });

    res.send('got it');
});

app.listen(13427, () => {
    console.log(`what`);
});

const wss = new WebSocket.Server({ port: 13428 });

function sendToAll(data) {
    displays.forEach(ws => {
        ws.send(JSON.stringify(data));
    });
}

wss.on('connection', (ws, req) => {
    displays.add(ws);
    
    ws.on('message', async (data) => {
        const json = JSON.parse(data.toString());

        switch (json.op) {
            case 'login': {
                ws.send(JSON.stringify({
                    op: 'append_discord',
                    d: {
                        url: URL.replace(/%guild_id%/g, currentGuildId).replace(/%channel_id%/g, currentChannelId)
                    }
                }));

                break;
            }

            case 'get_current_members': {
                ws.send(JSON.stringify({
                    op: 'update_members',
                    d: {
                        members: currentMembers
                    }
                }));

                break;
            }

            case 'update_current_channel': {
                currentChannelId = json.d.channelId;
                currentGuildId = json.d.guildId;

                await updateDisplay();

                sendToAll({
                    op: 'append_discord',
                    d: {
                        url: URL.replace(/%guild_id%/g, currentGuildId).replace(/%channel_id%/g, currentChannelId)
                    }
                });
                break;
            }

            case 'get_user_mapping': {
                if (!config.user_ids[json.d.user_id])
                    return;

                ws.send(JSON.stringify({
                    op: 'user_mapping',
                    d: {
                        user_id: json.d.user_id,
                        username: config.user_ids[json.d.user_id]
                    }
                }));

                break;
            }
        }
    });

    ws.on('close', () => {
        displays.delete(ws);
    });
});