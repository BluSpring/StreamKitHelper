import threading
import asyncio
import obspython as obs
from websockets.exceptions import ConnectionClosed
from websockets.client import connect
import json
from typing import Optional

current_url = "https://streamkit.discord.com/overlay/voice/0/0?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=3&invite_code=&limit_speaking=true&small_avatars=false&hide_names=false&fade_chat=0"

_LOOP: Optional[asyncio.AbstractEventLoop] = None
THREAD: Optional[threading.Thread] = None

def script_load(settings):
    global THREAD
    THREAD = threading.Thread(None, welp, daemon=True)
    THREAD.start()

    print("several mistakes")

def welp():
    global _LOOP
    _LOOP = asyncio.new_event_loop()
    asyncio.set_event_loop(_LOOP)

    asyncio.run(setup_websocket())
    _LOOP.run_forever()

    _LOOP.close()
    _LOOP = None

def script_unload():
    global _LOOP
    global THREAD
    if _LOOP is not None:
        _LOOP.call_soon_threadsafe(lambda l: l.stop(), _LOOP)

    if THREAD is not None:
        THREAD.join(timeout = 5)
        THREAD = None

async def setup_websocket():
    global current_url
    async for ws in connect("ws://localhost:13428"):
        try:
            await ws.send("{\"op\":\"login\"}")

            while True:
                try:
                    message = await ws.recv()
                    data = json.loads(message)
                    print(data)

                    if data['op'] == "append_discord":
                        current_url = data['d']['url']
                        update()
                except ConnectionClosed:
                    print("disconnected, attempting reconnection")
                    break
        except ConnectionClosed:
            continue

def update():
    global current_url
    source = obs.obs_get_source_by_name("Discord Voice Overlay")
    settings = obs.obs_source_get_settings(source)

    data = json.loads(obs.obs_data_get_json_pretty(settings))

    data['url'] = current_url

    data_obs = obs.obs_data_create_from_json(json.dumps(data))

    obs.obs_source_update(source, data_obs)
    obs.obs_data_release(data_obs)