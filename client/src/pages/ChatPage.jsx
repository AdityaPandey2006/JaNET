import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Chats = () => {
  const [friendIds, setFriendIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const navigate = useNavigate();

  //get frind ids
  const fetchFriends = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const { _id: userId1 } = JSON.parse(storedUser);

      const response = await fetch(
        `http://localhost:5000/api/users/${userId1}/getFriends`
      );

      const ids = await response.json();
      setFriendIds(ids);

      // Fetch details for each ID
      GetFriendsDetails(ids.friends);

    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // Get user details for each friend ID
  const GetFriendsDetails = async (ids) => {
    try {
      const friendsArr = [];

      for (const id of ids) {
        const res = await fetch(`http://localhost:5000/api/users/${id}`);
        const friendObj = await res.json();
        friendsArr.push(friendObj);
      }

      setFriends(friendsArr);
    } catch (err) {
      console.error("Error fetching friend details:", err.message);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div style={styles.container}>

      {/* LEFT SIDE — FRIEND LIST */}
      <div style={styles.leftPane}>
        <h2 style={styles.header}>Chats</h2>

        {friends.length === 0 ? (
          <p>No friends available.</p>
        ) : (
          friends.map((friend) => (
            <div style={styles.friendCard} key={friend._id}>
              <span style={styles.friendName}>{friend.username || friend.name}</span>

              <button
                style={styles.msgButton}
                onClick={() => navigate(`/ChatBox/${friend._id}`)}
              >
                Message
              </button>
            </div>
          ))
        )}
      </div>

      {/* RIGHT SIDE — CHAT WINDOW */}
      <div style={styles.rightPane}>
        {activeChat ? (
          <>
            <h2>Chat with {activeChat.username || activeChat.name}</h2>

            <div style={styles.messages}></div>

            <div style={styles.inputArea}>
              <input type="text" placeholder="Type a message..." style={styles.input} />
              <button style={styles.sendBtn}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <h2>Select a friend to start chatting</h2>
          </div>
        )}
      </div>

    </div>
  );
};

export default Chats;

const styles = {
  container: {
    display: "flex",
    width: "100%",
    height: "90vh",
    background: "#f4f4f4",
  },

  leftPane: {
    width: "30%",
    background: "white",
    padding: "20px",
    borderRight: "1px solid #ddd",
  },

  header: {
    marginBottom: "20px",
    fontSize: "24px",
  },

  friendCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 10px",
    marginBottom: "12px",
    background: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  friendName: {
    fontSize: "16px",
    fontWeight: "500",
  },

msgButton: {
    background: "linear-gradient(90deg, #4b6bfb 0%, #7b2ff7 100%)",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0px 4px 10px rgba(75, 107, 251, 0.3)",
    transition: "all 0.2s ease",
},

  rightPane: {
    width: "70%",
    padding: "20px",
  },

  messages: {
    height: "65vh",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginBottom: "12px",
    background: "#fff",
  },

  inputArea: {
    display: "flex",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },

  sendBtn: {
    padding: "10px 15px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
