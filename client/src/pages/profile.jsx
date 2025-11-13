import React, { useEffect, useState } from "react";
import { FaCamera, FaHeart, FaPaperPlane, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 🔹 Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Temporary guest user
      setUser({
        username: "Guest",
        intro: "Dreaming in code.",
        friends: [],
      });
    }
  }, []);

  // 🔹 Fetch all posts for the user
  const getAllPosts = async () => {
    if (!user?._id) {
      console.error("User ID missing — cannot load posts");
      return;
    }

    try {
      setLoadingPosts(true);
      const response = await fetch(
        `http://localhost:5000/api/posts/${user._id}/userPosts`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch posts");
      }

      setPosts(data.posts || []);
      console.log("✅ Posts loaded:", data.posts);
    } catch (err) {
      console.error("❌ Failed to load posts:", err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  // 🔹 Automatically load posts when user data is ready
  useEffect(() => {
    if (user?._id) {
      getAllPosts();
    }
  }, [user]);

  // 🔹 Show loading screen until user data is ready
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center p-6 relative">
      {/* Connections Button */}
      <button
        onClick={() => navigate("/connections")}
        className="absolute top-4 right-6 text-pink-500 hover:text-pink-600 transition-transform transform hover:scale-110"
      >
        <FaHeart className="text-2xl" />
      </button>

      {/* Chat Page Button */}
      <button
        onClick={() => navigate("/ChatPage")}
        className="absolute top-4 right-16 text-blue-500 hover:text-blue-600 transition-transform transform hover:scale-110"
      >
        <FaPaperPlane className="text-2xl" />
      </button>

      {/*Create Post */}
      <button
        onClick={() => navigate("/create_posts")}
        className="absolute top-4 left-6 text-purple-500 hover:text-purple-700 transition-transform transform hover:scale-120"
      >
        <FaPlus className="text-2xl" />
      </button>

      {/*  Profile Section */}
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-6 mt-8">
        <div className="flex items-center space-x-6">
          {/* Profile Picture */}
          <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <FaCamera className="text-gray-500 text-3xl" />
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
            <p className="text-gray-600 italic mt-1">{user.intro || "No intro yet."}</p>

            {/* Stats */}
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">
                  {user.friends?.length || 0}
                </p>
                <p className="text-gray-500 text-sm">Friends</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">{posts.length}</p>
                <p className="text-gray-500 text-sm">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Posts Section */}
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex justify-between items-center">
          <span>Your Posts</span>
          {/* Optional Refresh Button */}
          <button
            onClick={getAllPosts}
            disabled={loadingPosts}
            className={`text-sm px-3 py-1 rounded-md transition ${
              loadingPosts
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            {loadingPosts ? "Refreshing..." : "Refresh"}
          </button>
        </h3>

        {loadingPosts ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center text-gray-500">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center text-gray-500">
            No posts yet — start sharing something!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <h4 className="text-lg font-semibold text-gray-800">{post.title}</h4>
                <p className="text-gray-600 mt-1">{post.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔻 Bottom Navigation */}
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
