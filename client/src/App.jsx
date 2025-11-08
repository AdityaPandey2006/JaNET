import React from "react"
import {Route,Routes} from 'react-router-dom'
import Login from "./pages/Login";
import Feed from "./pages/feed"
import Messages from "./pages/messages"
import ChatBox from "./pages/ChatBox"
import Chats from "./pages/ChatPage"
import Profile from "./pages/profile"
import Connections from "./pages/Connections"
import CreatePosts from "./pages/create_posts";

const App =() => {
  return(
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<ChatBox />} />
        <Route path="/Connections" element={<Connections />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:profileId" element={<Profile />} />
        <Route path="/create_posts" element={<CreatePosts />} />
        <Route path="/ChatPage" element={<Chats/>}/>
        <Route path="/ChatBox" element={<ChatBox/>}/>
      </Routes>
    </>
  )
}
export default App