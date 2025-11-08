import React, { useEffect, useState } from "react";

const Connections = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recommended] = useState([]);

  useEffect(() => {
    // Fetch pending friend requests for the logged-in user
    const fetchRequests = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const { _id: userId1 } = JSON.parse(storedUser);

        // backend route to get user data (assuming you already have it)
        const response = await fetch(`http://localhost:5000/api/users/${userId1}`);
        if (response.ok) {
          const data = await response.json();
          // friendRequests will contain array of { requestsFrom: userId }
          setPendingRequests(data.friendRequests || []);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (senderId) => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const { _id: userId1 } = JSON.parse(storedUser);

      // Backend call to accept friend request
      const response = await fetch("http://localhost:5000/api/friends/acceptrequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId1, senderId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Friend accepted:", data);
        // remove accepted request from list
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
            <div>
              {/* map over recommended later */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
