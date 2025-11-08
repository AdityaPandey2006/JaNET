import React, { useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate=useNavigate(); //define the navigatre hook here...
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    department: '',
    year: '',
    intro: '',
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // ======= REGISTER =======
        const res = await axios.post('http://localhost:5000/api/users/addUser', formData);
        alert(res.data.message);
      } else {
        // ======= LOGIN =======
        const res = await axios.post('http://localhost:5000/api/users/login', {
          email: formData.email,
          password: formData.password
        });
        alert(res.data.message);
        console.log('Logged in user:', res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        navigate("/profile");
      }

      setFormData({ name: '', username: '', email: '', password: '', department: '', year: '', intro: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };


  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-purple-100">
        {/* Header with gradient */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isRegister ? 'Join our community today' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-gray-700 font-medium">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block mb-2 text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
              placeholder="Enter your password"
              required
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">Department (optional)</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                  placeholder="Enter your department"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">Year (optional)</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                >
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">Intro (optional)</label>
                <textarea
                  name="intro"
                  value={formData.intro}
                  onChange={handleChange}
                  className="w-full border border-purple-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white resize-none"
                  placeholder="Write a short intro about yourself"
                  rows="3"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition duration-200 transform hover:scale-[1.02] shadow-md"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition duration-200"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;