import React, { useEffect, useState } from "react";
import { FaCamera, FaHeart ,FaPaperPlane} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // temporary dummy user until JWT/login added
      setUser({
        username: "Guest",
        intro: "Dreaming in code.",
        friends: [],
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center p-6 relative">
      {/* Love Button (top-right) */}
      <button
        onClick={() => navigate("/connections")}
        className="absolute top-4 right-6 text-pink-500 hover:text-pink-600 transition-transform transform hover:scale-110"
      >
        <FaHeart className="text-2xl" />
      </button>
      {/* Arrow for chats visitation*/ }
      <button
        onClick={() => navigate("/ChatPage")}
        className="absolute top-4 right-16 text-blue-500 hover:text-blue-600 transition-transform transform hover:scale-110"
      >
        <FaPaperPlane className="text-2xl"/>
      </button>

      {/* Profile Section */}
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-6 mt-8">
        <div className="flex items-center space-x-6">
          {/* Profile Picture Circle */}
          <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <FaCamera className="text-gray-500 text-3xl" />
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
            <p className="text-gray-600 italic mt-1">
              {user.intro || "No intro yet."}
            </p>

            {/* Stats Bar */}
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">
                  {user.friends?.length || 0}
                </p>
                <p className="text-gray-500 text-sm">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">0</p>
                <p className="text-gray-500 text-sm">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Posts Section */}
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Posts</h3>
        <div className="bg-gray-100 rounded-xl p-6 text-center text-gray-500">
          No posts yet — start sharing something!
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 w-full bg-white shadow-lg flex justify-around py-3 border-t border-gray-200">
        <button
          className="text-purple-600 font-semibold hover:text-purple-700"
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>
        <button
          className="text-gray-500 hover:text-purple-600 font-semibold"
          onClick={() => navigate("/feed")}
        >
          Feed
        </button>
      </div>
    </div>
  );
};

export default Profile;
