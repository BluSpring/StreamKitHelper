import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, SelectedChannelStore } from '@webpack/common';

let currentStateUrl = 'http://localhost:13427';
let currentVc = '0';

let currentMembers: string[] = [];

export async function sendCurrentVcData() {
    const vc = SelectedChannelStore.getVoiceChannelId();
    currentVc = vc?.toString() ?? '0';

    if (!vc) {
        await fetch(`${currentStateUrl}/0/0`, {mode: 'no-cors'});
        currentMembers = [];

        return;
    }

    const fullChannel = ChannelStore.getChannel(vc);
    const guild = fullChannel.guild_id;

    await fetch(`${currentStateUrl}/${guild}/${vc}`, {mode: 'no-cors'});
}

export default definePlugin({
    name: "StreamKitHelper",
    description: "Stream ",
    authors: [Devs.BluSpring],
    options: {
        changeStateUrl: {
            description: "URL to a server that changes the OBS StreamKit overlay automatically.",
            type: OptionType.STRING,
            default: 'http://localhost:13427',
            onChange: v => {
                currentStateUrl = v;
                sendCurrentVcData();
            }
        }
    },
    patches: [
    ],
    start: () => sendCurrentVcData(),
    flux: {
        VOICE_SERVER_UPDATE: () => {
            sendCurrentVcData();
        },
        VOICE_CHANNEL_SELECT: (ev) => {
            sendCurrentVcData();
        },
        SPEAKING: async (ev) => {
            // {type: 'SPEAKING', context: 'default', userId: '742595879520698429', speakingFlags: 1}
            if (ev.speakingFlags)
                await fetch(`${currentStateUrl}/speaking/start/${ev.userId}`, {mode: 'no-cors'});
            else if (!ev.speakingFlags)
                await fetch(`${currentStateUrl}/speaking/stop/${ev.userId}`, {mode: 'no-cors'});
        },
        STOP_SPEAKING: async (ev) => {
            // {type: 'SPEAKING', context: 'default', userId: '742595879520698429', speakingFlags: 1}
            if (ev.speakingFlags)
                await fetch(`${currentStateUrl}/speaking/start/${ev.userId}`, {mode: 'no-cors'});
            else if (!ev.speakingFlags)
                await fetch(`${currentStateUrl}/speaking/stop/${ev.userId}`, {mode: 'no-cors'});
        },
        VOICE_STATE_UPDATES: async (ev) => {
            /*
                {
                    type: "VOICE_STATE_UPDATES",
                    voiceStates: [
                        {
                            channelId: "1114973772324286538"
                            deaf: false
                            guildId: "1114973770592030772"
                            mute: false
                            oldChannelId: undefined
                            requestToSpeakTimestamp: null
                            selfDeaf: false
                            selfMute: true
                            selfStream: false
                            selfVideo: false
                            sessionId: ""
                            suppress: false
                            userId: "742595879520698429"
                        }
                    ]
                }
            */
            if (currentVc == '0')
                return;

            for (const state of ev.voiceStates) {
                if (state.channelId != currentVc) {
                    if (currentMembers.includes(state.userId))
                        currentMembers = currentMembers.filter(a => a != state.userId);

                    continue;
                }

                if (!currentMembers.includes(state.userId))
                    currentMembers.push(state.userId);
            }

            await fetch(`${currentStateUrl}/states?members=${currentMembers.join(',')}`, {mode: 'no-cors'})
        }
    }
});
