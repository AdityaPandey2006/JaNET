import React, { useEffect, useState } from "react";

const Connections = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // 🔹 Fetch Pending Requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const { _id: userId1 } = JSON.parse(storedUser);

        const response = await fetch(`http://localhost:5000/api/users/${userId1}`);
        if (response.ok) {
          const data = await response.json();
          setPendingRequests(data.friendRequests || []);
        } else {
          console.error("Failed to fetch friend requests");
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };

    fetchRequests();
  }, []);

  // 🔹 Accept Friend Request
  const handleAccept = async (senderId) => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const { _id: userId1 } = JSON.parse(storedUser);

      const response = await fetch("http://localhost:5000/api/friends/acceptrequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId1, senderId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Friend accepted:", data);
        setPendingRequests((prev) =>
          prev.filter((req) => req.requestsFrom !== senderId)
        );
      } else {
        const errData = await response.json();
        console.error("Error accepting request:", errData.message);
      }
    } catch (err) {
      console.error("Error while accepting request:", err);
    }
  };

  // 🔹 Fetch Friend Recommendations
  const friend_recommendations = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const { _id: userId1 } = JSON.parse(storedUser);

      // ✅ fixed URL (use backticks)
      const response = await fetch(
        `http://localhost:5000/api/users/${userId1}/giveRecommendation`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Friend recommendations:", data.recommendations);
        setRecommended(data.recommendations || []);
      } else {
        throw new Error("Failed to fetch friend recommendations");
      }
    } catch (error) {
      console.error("Error while getting friend recommendations:", error.message);
    }
  };

   // 🔹 Fetch recommendations on mount
  useEffect(() => {
    friend_recommendations();
  }, []);

  const handleFriendRequest = async (receiverId) => {
    try {
      setError("");
      setSuccess("");
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const { _id: senderId } = JSON.parse(storedUser); //declaring sender id and as the id of the user

      console.log("Sender:", senderId, "Receiver:", receiverId);
      const response = await fetch(
        "http://localhost:5000/api/friends/sendrequest",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId, receiverId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send request");
        return;
      }

      setSuccess("Friend request sent successfully!!!");
    } catch (err) {
      setError("Error sending friend request: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Connections</h2>

        {/* Pending Requests Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Pending Friend Requests
          </h3>

          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-100 p-4 rounded-xl"
                >
                  <p className="text-gray-800 font-medium">
                    {req.username || req.requestsFrom}
                  </p>
                  <button
                    onClick={() => handleAccept(req.requestsFrom)}
                    className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700"
                  >
                    Accept Request
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No pending requests.</p>
          )}
        </div>

        {/* Recommended Friends Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Recommended Friends
          </h3>

          {recommended.length === 0 ? (
            <p className="text-gray-500 italic">No recommendations yet.</p>
          ) : (
            <div className="space-y-4">
              {recommended.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-100 p-4 rounded-xl"
                >
                  <div>
                    <p className="text-gray-800 font-medium">
                      UserName: {rec.username}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Mutual Friends: {rec.mutual}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Similarity: {rec.sim.toFixed(2)}
                    </p>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700"
                    onClick={() => handleFriendRequest(rec.id)}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
