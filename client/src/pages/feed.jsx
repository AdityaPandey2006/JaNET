import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Feed = () => {
  const [username, setUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  //basically when we loggedin we storeed the user in the local storage of the browser so whrn we send request the send id can be extracted from here..
  const user = JSON.parse(localStorage.getItem("user"));
  const senderId = user?._id;




  const handleSearch = async () => {
    try {
      setError("");
      setSearchedUser(null);
      setSuccess("");
      const response = await fetch(
        `http://localhost:5000/api/users/search/${username}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "User not found");
        return;
      }

      const data = await response.json();
      setSearchedUser(data);
    } catch (err) {
      setError("Error searching user: " + err.message);
    }
  };

  const handleFriendRequest = async (receiverId) => {
    try {
      setError("");
      setSuccess("");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center p-6">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Feed</h1>

        {/* Search Bar */}
        <div className="flex items-center mb-6 space-x-3">
          <input
            type="text"
            placeholder="Search by username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 p-3 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition duration-200"
          >
            Search
          </button>
        </div>

        {/* Result Display */}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}

        {searchedUser && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">{searchedUser.name}</h3>
            <p className="text-gray-600"><strong>Username:</strong> {searchedUser.username}</p>
            <p className="text-gray-600"><strong>Email:</strong> {searchedUser.email}</p>
            <p className="text-gray-600"><strong>Department:</strong> {searchedUser.department}</p>
            <p className="text-gray-600"><strong>Year:</strong> {searchedUser.year}</p>
            <p className="text-gray-600"><strong>Intro:</strong> {searchedUser.intro}</p>

            <button
              onClick={() => handleFriendRequest(searchedUser._id)}
              className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
            >
              Send Friend Request 💌
            </button>
          </div>
        )}

        {!searchedUser && !error && (
          <div className="text-gray-500 text-center mt-8">
            Start by searching for a user 👀
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white shadow-lg flex justify-around py-3 border-t border-gray-200">
        <button
          className="text-gray-500 hover:text-purple-600 font-semibold"
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>
        <button
          className="text-purple-600 font-semibold hover:text-purple-700"
          onClick={() => navigate("/feed")}
        >
          Feed
        </button>
      </div>
    </div>
  );
};

export default Feed;
