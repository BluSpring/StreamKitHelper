/**
 * @type {WebSocket}
 */
let ws;

const mapping = new Map();
let members = [];

function connect() {
    ws = new WebSocket('ws://localhost:13428');

    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({
            op: 'get_current_members'
        }));
    });

    ws.addEventListener('message', (ev) => {
        const data = JSON.parse(ev.data.toString());

        switch (data.op) {
            case 'user_mapping': {
                mapping.set(data.d.user_id, data.d.username);
                updateMembers();

                break;
            }

            case 'update_members': {
                members = data.d.members;
                console.log(members);
                updateMembers();

                break;
            }

            case 'start_speaking': {
                const username = mapping.get(data.d.user_id);
                const avatar = document.getElementById(data.d.user_id);

                if (!avatar)
                    return;

                avatar.src = `/avatars/${username}/speaking.png`;
                avatar.classList.add('speaking');

                break;
            }

            case 'stop_speaking': {
                const username = mapping.get(data.d.user_id);
                const avatar = document.getElementById(data.d.user_id);

                if (!avatar)
                    return;

                avatar.src = `/avatars/${username}/normal.png`;
                avatar.classList.remove('speaking');

                break;
            }
        }
    });

    ws.addEventListener('close', (ev) => {
        console.error(`Exited from socket with error code ${ev.code}`);
        setTimeout(() => {
            connect();
        }, 2500);
    });
}

connect();

function updateMembers() {
    const avatars = document.getElementById('avatars');

    let exists = [];
    for (const child of avatars.children) {
        if (!members.includes(child.id)) {
            child.remove();
        } else {
            exists.push(child.id);
        }
    }

    const shouldAdd = members.filter(a => !exists.includes(a));

    for (const id of shouldAdd) {
        if (!mapping.has(id)) {
            ws.send(JSON.stringify({
                op: 'get_user_mapping',
                d: {
                    user_id: id
                }
            }));
        } else {
            const img = document.createElement('img');
            img.src = `/avatars/${mapping.get(id)}/normal.png`;
            img.id = id;

            avatars.appendChild(img);
        }
    }
}