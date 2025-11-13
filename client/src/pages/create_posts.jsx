import React, { useState } from 'react';

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const userStr = localStorage.getItem("user");
  let senderId = null;
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    senderId = user?._id || null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  const createPost = async (tit, des) => {
    // guard to avoid calling multiple times
    if (loading) return;
    setError("");
    setMessage("");

    if (!senderId) {
      setError("User not found. Please log in.");
      return;
    }

    if (!tit?.trim() || !des?.trim()) {
      setError("Title and description cannot be empty.");
      return;
    }

    setLoading(true);
    console.log("Creating post for user:", senderId);

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${senderId}/addPost`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tit, description: des }),
      });

      const data = await response.json();
      console.log("POST response:", response.status, data);

      if (response.ok) {
        setMessage("Post created successfully!");
        setTitle("");
        setDescription("");
      } else {
        setError(data.message || `Failed to create post (status ${response.status})`);
      }
    } catch (err) {
      console.error("Create post error:", err);
      setError("Post not created: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Create New Post</h2>

        <input
          type="text"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <textarea
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-md h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={() => createPost(title, description)}        // <<< correct: pass a function
          disabled={loading}
          className={`w-full py-2 rounded-md transition ${loading ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
        >
          {loading ? "Creating..." : "Create Post"}
        </button>

        {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default CreatePost;
