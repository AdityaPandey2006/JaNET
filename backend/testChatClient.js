const API_BASE = "http://localhost:5000";
const socket = io(API_BASE);

let currentUser = null;
let selectedFriend = null;

const messageform = document.querySelector(".chatbox form");
const messageList = document.querySelector("#messagelist");
const friendList = document.querySelector("ul#users");
const chatboxinput = document.querySelector(".chatbox input");
const useraddform = document.querySelector(".modal");
const backdrop = document.querySelector(".backdrop");
const useraddinput = document.querySelector(".modal input");

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
    }

    return data;
}

function makeTestEmail(username) {
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${safeUsername || "user"}@test.local`;
}

async function findOrCreateUser(username) {
    try {
        return await fetchJson(`${API_BASE}/api/users/search/${encodeURIComponent(username)}`);
    } catch (err) {
        const created = await fetchJson(`${API_BASE}/api/users/addUser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: username,
                username,
                email: makeTestEmail(username),
                password: "test-password"
            })
        });

        return created.user;
    }
}

async function getUserById(userId) {
    return fetchJson(`${API_BASE}/api/users/${userId}`);
}

async function loadFriends() {
    friendList.innerHTML = "";
    selectedFriend = null;

    if (!currentUser.friends || currentUser.friends.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No friends yet";
        emptyItem.className = "empty";
        friendList.appendChild(emptyItem);
        return;
    }

    const friends = await Promise.all(
        currentUser.friends.map((friend) => getUserById(friend.userId))
    );

    friends.forEach((friend) => {
        const friendItem = document.createElement("li");
        friendItem.textContent = friend.name || friend.username;
        friendItem.dataset.friendId = friend._id;

        friendItem.addEventListener("click", async () => {
            selectedFriend = friend;

            document.querySelectorAll("#users li").forEach((item) => {
                item.classList.remove("selected");
            });
            friendItem.classList.add("selected");

            await loadMessages(friend._id);
        });

        friendList.appendChild(friendItem);
    });
}

async function loadMessages(friendId) {
    messageList.innerHTML = "";

    const messages = await fetchJson(
        `${API_BASE}/api/chats/${currentUser._id}/${friendId}`
    );

    messages.forEach(addMessageToList);
}

function addMessageToList(chat) {
    const messageItem = document.createElement("li");
    const senderLabel = document.createElement("p");
    const messageText = document.createElement("p");

    senderLabel.textContent = chat.sender === currentUser._id ? "You" : selectedFriend?.name || "Friend";
    messageText.textContent = chat.message;

    messageItem.appendChild(senderLabel);
    messageItem.appendChild(messageText);
    messageList.appendChild(messageItem);
    messageList.scrollTop = messageList.scrollHeight;
}

useraddform.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = useraddinput.value.trim();
    if (!username) return;

    try {
        currentUser = await findOrCreateUser(username);
        socket.emit("join", currentUser._id);

        useraddform.classList.add("disappear");
        backdrop.classList.add("disappear");

        await loadFriends();
    } catch (err) {
        console.error("Could not create or load user:", err);
        alert(err.message);
    }
});

messageform.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = chatboxinput.value.trim();
    if (!message || !currentUser || !selectedFriend) return;

    socket.emit("sendMessage", {
        sender: currentUser._id,
        reciever: selectedFriend._id,
        message
    }, (response) => {
        if (!response.success) {
            console.error("Server response:", response);
            alert(response.error || "Message failed");
        }
    });

    chatboxinput.value = "";
});

socket.on("connect", () => {
    console.log("Connected as:", socket.id);
});

socket.on("receiveMessage", (chat) => {
    if (selectedFriend && chat.sender === selectedFriend._id) {
        addMessageToList(chat);
    }
});

socket.on("sentMessage", (chat) => {
    if (selectedFriend && chat.reciever === selectedFriend._id) {
        addMessageToList(chat);
    }
});
